import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migrations1775347200000 implements MigrationInterface {
    name = 'Migrations1775347200000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "cohort_week" ADD "scheduledDate" TIMESTAMP WITH TIME ZONE`,
        );

        await queryRunner.query(`
            UPDATE "cohort_week"
            SET "scheduledDate" = c."startDate" + ("cohort_week"."week" * 7) * INTERVAL '1 day'
            FROM "cohort" c
            WHERE c."id" = "cohort_week"."cohortId"
        `);

        await queryRunner.query(
            `ALTER TABLE "cohort_week" ALTER COLUMN "scheduledDate" SET NOT NULL`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "cohort_week" DROP COLUMN "scheduledDate"`,
        );
    }
}
