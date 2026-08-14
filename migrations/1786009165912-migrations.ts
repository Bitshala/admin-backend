import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migrations1786009165912 implements MigrationInterface {
    name = 'Migrations1786009165912';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE "computed_metric" ("createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" character varying(50) NOT NULL, "version" integer NOT NULL DEFAULT '1', "data" jsonb NOT NULL, CONSTRAINT "UQ_34846c3f8d1eee358d1c29e82f0" UNIQUE ("type"), CONSTRAINT "PK_1940028ccd8858754ffb92db011" PRIMARY KEY ("id"))`,
        );

        // Seed the recurring cohort-metrics job so the store populates on
        // deploy. executeOnTime = now() => the 10s poller runs it within
        // seconds; the handler self-reschedules the next run at 00:00 UTC.
        await queryRunner.query(
            `INSERT INTO "api_task" ("type", "data", "executeOnTime", "status", "retryCount", "retryLimit") VALUES ('COMPUTE_COHORT_METRICS', '{}'::jsonb, now(), 'UNPROCESSED', 0, 3)`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `DELETE FROM "api_task" WHERE "type" = 'COMPUTE_COHORT_METRICS'`,
        );
        await queryRunner.query(`DROP TABLE "computed_metric"`);
    }
}
