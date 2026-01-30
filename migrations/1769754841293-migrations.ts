import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migrations1769754841293 implements MigrationInterface {
    name = 'Migrations1769754841293';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "exercise_score" DROP COLUMN "hasGoodDocumentation"`,
        );
        await queryRunner.query(
            `ALTER TABLE "exercise_score" DROP COLUMN "hasGoodStructure"`,
        );
        await queryRunner.query(
            `ALTER TABLE "cohort" ADD "hasExercises" boolean`,
        );
        await queryRunner.query(
            `UPDATE "cohort" SET "hasExercises" = true WHERE type != 'MASTERING_BITCOIN'`,
        );
        await queryRunner.query(
            `UPDATE "cohort" SET "hasExercises" = false WHERE type = 'MASTERING_BITCOIN'`,
        );
        await queryRunner.query(
            `ALTER TABLE "cohort" ALTER COLUMN "hasExercises" SET NOT NULL`,
        );
        await queryRunner.query(
            `DELETE FROM exercise_score WHERE "cohortId" IN (SELECT id FROM cohort WHERE type = 'MASTERING_BITCOIN')`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "cohort" DROP COLUMN "hasExercises"`,
        );
        await queryRunner.query(
            `ALTER TABLE "exercise_score" ADD "hasGoodStructure" boolean NOT NULL DEFAULT false`,
        );
        await queryRunner.query(
            `ALTER TABLE "exercise_score" ADD "hasGoodDocumentation" boolean NOT NULL DEFAULT false`,
        );
    }
}
