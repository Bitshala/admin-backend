import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migrations1775842011163 implements MigrationInterface {
    name = 'Migrations1775842011163';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "cohort" DROP COLUMN "endDate"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "cohort" ADD "endDate" TIMESTAMP WITH TIME ZONE`,
        );
        await queryRunner.query(`
            UPDATE "cohort" c
            SET "endDate" = (
                SELECT MAX(cw."scheduledDate")
                FROM "cohort_week" cw
                WHERE cw."cohortId" = c."id"
            )
        `);
        await queryRunner.query(
            `ALTER TABLE "cohort" ALTER COLUMN "endDate" SET NOT NULL`,
        );
    }
}
