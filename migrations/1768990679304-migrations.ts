import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migrations1768990679304 implements MigrationInterface {
    name = 'Migrations1768990679304';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE "calendar" ("createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "cohortId" uuid NOT NULL, "googleCalendarId" character varying NOT NULL, "summary" character varying, "timezone" character varying, "isActive" boolean NOT NULL DEFAULT true, "deletedAt" TIMESTAMP, CONSTRAINT "PK_2492fb846a48ea16d53864e3267" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `ALTER TABLE "calendar" ADD CONSTRAINT "FK_c8d3ab0c713a472057ea6cb7357" FOREIGN KEY ("cohortId") REFERENCES "cohort"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "calendar" DROP CONSTRAINT "FK_c8d3ab0c713a472057ea6cb7357"`,
        );
        await queryRunner.query(`DROP TABLE "calendar"`);
    }
}
