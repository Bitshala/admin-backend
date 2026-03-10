import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migrations1772060400000 implements MigrationInterface {
    name = 'Migrations1772060400000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            INSERT INTO api_task ("id", "type", "status", "data", "executeOnTime", "retryCount", "retryLimit", "createdAt", "updatedAt")
            SELECT
                uuid_generate_v4(),
                'SEND_COHORT_REMINDER_EMAILS',
                'UNPROCESSED',
                jsonb_build_object('cohortId', c."id", 'cohortWeekId', cw."id"),
                CASE
                    WHEN c."type" IN ('MASTERING_BITCOIN', 'MASTERING_LIGHTNING_NETWORK') AND cw."week" >= 5
                    THEN (c."startDate" + (cw."week" * INTERVAL '7 days') + INTERVAL '7 days' + INTERVAL '6 hours 30 minutes')
                    ELSE (c."startDate" + (cw."week" * INTERVAL '7 days') + INTERVAL '6 hours 30 minutes')
                END,
                0,
                3,
                NOW(),
                NOW()
            FROM cohort c
            JOIN cohort_week cw ON cw."cohortId" = c."id"
            WHERE c."endDate" > NOW()
              AND cw."type" != 'GRADUATION'
              AND (c."startDate" + (cw."week" * INTERVAL '7 days') + INTERVAL '6 hours 30 minutes') > NOW()
        `);

        await queryRunner.query(`
            UPDATE cohort
            SET "endDate" = "endDate" + INTERVAL '7 days'
            WHERE "id" IN (
                '0272b967-5fa2-4538-8430-5ef31e6df4ba',
                'fd046a36-5e62-44b2-a404-ff9ef44a8f10'
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `DELETE FROM api_task WHERE "type" = 'SEND_COHORT_REMINDER_EMAILS'`,
        );

        await queryRunner.query(`
            UPDATE cohort
            SET "endDate" = "endDate" - INTERVAL '7 days'
            WHERE "id" IN (
                '0272b967-5fa2-4538-8430-5ef31e6df4ba',
                'fd046a36-5e62-44b2-a404-ff9ef44a8f10'
            )
        `);
    }
}
