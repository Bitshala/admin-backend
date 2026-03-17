import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migrations1773645534213 implements MigrationInterface {
    name = 'Migrations1773645534213';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "feedback" DROP COLUMN "feedbackText"`,
        );
        await queryRunner.query(`DELETE FROM "feedback"`);
        await queryRunner.query(
            `ALTER TABLE "feedback" ADD "componentRatings" jsonb`,
        );
        await queryRunner.query(
            `ALTER TABLE "feedback" ADD "expectations" text`,
        );
        await queryRunner.query(
            `ALTER TABLE "feedback" ADD "improvements" text`,
        );
        await queryRunner.query(
            `ALTER TABLE "feedback" ADD "opportunityInterests" jsonb NOT NULL DEFAULT '[]'`,
        );
        await queryRunner.query(
            `ALTER TABLE "feedback" ADD "fellowshipInterests" jsonb NOT NULL DEFAULT '[]'`,
        );
        await queryRunner.query(
            `ALTER TABLE "feedback" ADD "idealProject" text`,
        );
        await queryRunner.query(
            `ALTER TABLE "feedback" ADD "testimonial" text`,
        );

        await queryRunner.query(`
            INSERT INTO api_task ("id", "type", "status", "data", "executeOnTime", "retryCount", "retryLimit", "createdAt", "updatedAt")
            SELECT
                uuid_generate_v4(),
                'SEND_COHORT_REMINDER_EMAILS',
                'UNPROCESSED',
                jsonb_build_object('cohortId', last_task."cohortId", 'cohortWeekId', cw."id"),
                last_task."maxExecuteOnTime" + INTERVAL '7 days',
                0,
                3,
                NOW(),
                NOW()
            FROM (
                SELECT
                    (t."data"->>'cohortId')::uuid AS "cohortId",
                    MAX(t."executeOnTime") AS "maxExecuteOnTime"
                FROM api_task t
                WHERE t."type" = 'SEND_COHORT_REMINDER_EMAILS'
                  AND t."status" = 'UNPROCESSED'
                GROUP BY (t."data"->>'cohortId')::uuid
            ) last_task
            JOIN cohort_week cw
              ON cw."cohortId" = last_task."cohortId"
             AND cw."type" = 'GRADUATION'
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DELETE FROM api_task
            WHERE "type" = 'SEND_COHORT_REMINDER_EMAILS'
              AND ("data"->>'cohortWeekId')::uuid IN (
                  SELECT cw."id" FROM cohort_week cw WHERE cw."type" = 'GRADUATION'
              )
        `);

        await queryRunner.query(
            `ALTER TABLE "feedback" DROP COLUMN "testimonial"`,
        );
        await queryRunner.query(
            `ALTER TABLE "feedback" DROP COLUMN "idealProject"`,
        );
        await queryRunner.query(
            `ALTER TABLE "feedback" DROP COLUMN "fellowshipInterests"`,
        );
        await queryRunner.query(
            `ALTER TABLE "feedback" DROP COLUMN "opportunityInterests"`,
        );
        await queryRunner.query(
            `ALTER TABLE "feedback" DROP COLUMN "improvements"`,
        );
        await queryRunner.query(
            `ALTER TABLE "feedback" DROP COLUMN "expectations"`,
        );
        await queryRunner.query(
            `ALTER TABLE "feedback" DROP COLUMN "componentRatings"`,
        );
        await queryRunner.query(
            `ALTER TABLE "feedback" ADD "feedbackText" text NOT NULL`,
        );
    }
}
