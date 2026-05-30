import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migrations1780141910798 implements MigrationInterface {
    name = 'Migrations1780141910798';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "cohort_week" ADD "title" text`);
        await queryRunner.query(
            `ALTER TABLE "cohort_week" ADD "readingMaterial" jsonb NOT NULL DEFAULT '[]'`,
        );
        await queryRunner.query(
            `ALTER TABLE "cohort_week" ADD "activity" text`,
        );
        await queryRunner.query(
            `ALTER TABLE "cohort_week" ADD "exercise" jsonb`,
        );
        await queryRunner.query(
            `ALTER TABLE "cohort" ADD "links" jsonb NOT NULL DEFAULT '[]'`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "cohort" DROP COLUMN "links"`);
        await queryRunner.query(
            `ALTER TABLE "cohort_week" DROP COLUMN "exercise"`,
        );
        await queryRunner.query(
            `ALTER TABLE "cohort_week" DROP COLUMN "activity"`,
        );
        await queryRunner.query(
            `ALTER TABLE "cohort_week" DROP COLUMN "readingMaterial"`,
        );
        await queryRunner.query(`ALTER TABLE "cohort_week" DROP COLUMN "title"`);
    }
}
