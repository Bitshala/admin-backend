import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migrations1785456000000 implements MigrationInterface {
    name = 'Migrations1785456000000';

    /**
     * Repairs fellowships whose status drifted from their documents.
     *
     * `syncFellowshipStatus` used to do an unlocked read-compute-write under
     * READ COMMITTED, so two concurrent document mutations could each read the
     * other's pre-commit row, both conclude "nothing changed" and neither
     * write. That left fellowships stuck in two directions: AWAITING_DOCUMENTS
     * with both documents PENDING_REVIEW, and DOCUMENTS_IN_REVIEW with both
     * documents APPROVED (terminal — no admin action could re-trigger a sync).
     *
     * This recomputes exactly what the service computes. The status filter
     * mirrors DOCUMENT_PHASE_STATUSES, so PENDING / ACTIVE / COMPLETED rows are
     * never touched.
     */
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            UPDATE "fellowship" f
            SET "status" = d."nextStatus",
                "updatedAt" = now()
            FROM (
                SELECT
                    fd."applicationId",
                    (CASE
                        WHEN count(*) <> 2
                            THEN 'AWAITING_DOCUMENTS'
                        WHEN count(*) FILTER (
                                WHERE fd."status" = 'APPROVED'
                            ) = 2
                            THEN 'DOCUMENTS_APPROVED'
                        WHEN count(*) FILTER (
                                WHERE fd."status" IN ('APPROVED', 'PENDING_REVIEW')
                            ) = 2
                            THEN 'DOCUMENTS_IN_REVIEW'
                        ELSE 'AWAITING_DOCUMENTS'
                    END)::"public"."fellowship_status_enum" AS "nextStatus"
                FROM "fellowship_document" fd
                WHERE fd."type" IN ('SIGNED_CONTRACT', 'W8BEN')
                GROUP BY fd."applicationId"
            ) d
            WHERE f."applicationId" = d."applicationId"
              AND f."status" IN (
                  'AWAITING_DOCUMENTS',
                  'DOCUMENTS_IN_REVIEW',
                  'DOCUMENTS_APPROVED'
              )
              AND f."status" <> d."nextStatus"
        `);
    }

    /**
     * Data repair only — the pre-repair values were incorrect by definition, so
     * there is nothing meaningful to restore.
     */
    public async down(): Promise<void> {
        // no-op
    }
}
