import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migrations1756906294886 implements MigrationInterface {
    name = 'Migrations1756906294886';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "cohort_week" ALTER COLUMN "questions" SET DEFAULT '[]'`,
        );
        await queryRunner.query(
            `ALTER TABLE "cohort_week" ALTER COLUMN "questions" SET NOT NULL`,
        );
        await queryRunner.query(
            `ALTER TABLE "cohort_week" ALTER COLUMN "bonusQuestion" SET DEFAULT '[]'`,
        );
        await queryRunner.query(
            `ALTER TABLE "cohort_week" ALTER COLUMN "bonusQuestion" SET NOT NULL`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "cohort_week" ALTER COLUMN "bonusQuestion" DROP NOT NULL`,
        );
        await queryRunner.query(
            `ALTER TABLE "cohort_week" ALTER COLUMN "bonusQuestion" DROP DEFAULT`,
        );
        await queryRunner.query(
            `ALTER TABLE "cohort_week" ALTER COLUMN "questions" DROP NOT NULL`,
        );
        await queryRunner.query(
            `ALTER TABLE "cohort_week" ALTER COLUMN "questions" DROP DEFAULT`,
        );
    }
}
