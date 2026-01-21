import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migrations1768990679304 implements MigrationInterface {
    name = 'Migrations1768990679304';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "cohort" ADD "googleCalendarId" character varying`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "cohort" DROP COLUMN "googleCalendarId"`,
        );
    }
}
