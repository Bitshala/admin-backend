import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migrations1762762100000 implements MigrationInterface {
    name = 'Migrations1762762100000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "feedback" ADD CONSTRAINT "UQ_feedback_user_cohort" UNIQUE ("userId", "cohortId")`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "feedback" DROP CONSTRAINT "UQ_feedback_user_cohort"`,
        );
    }
}
