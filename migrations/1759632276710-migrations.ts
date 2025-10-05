import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migrations1759632276710 implements MigrationInterface {
    name = 'Migrations1759632276710';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TYPE "public"."api_task_status_enum" AS ENUM('UNPROCESSED', 'PROCESSING', 'PROCESSED', 'FAILED', 'CANCELLED')`,
        );
        await queryRunner.query(
            `CREATE TABLE "api_task" ("createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" character varying(50) NOT NULL, "status" "public"."api_task_status_enum" NOT NULL DEFAULT 'UNPROCESSED', "data" jsonb NOT NULL, "processStartTime" TIMESTAMP WITH TIME ZONE, "retryCount" integer NOT NULL DEFAULT '0', "retryLimit" integer NOT NULL DEFAULT '3', "lastExecutionFailureDetails" text, "lastRetryTime" TIMESTAMP WITH TIME ZONE, "executeOnTime" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_7fae028cdfd8eb9a92a62a46c7f" PRIMARY KEY ("id"))`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "api_task"`);
        await queryRunner.query(`DROP TYPE "public"."api_task_status_enum"`);
    }
}
