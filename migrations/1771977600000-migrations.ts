import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migrations1771977600000 implements MigrationInterface {
    name = 'Migrations1771977600000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "cohort" ADD "classroomId" text`);
        await queryRunner.query(
            `ALTER TABLE "cohort_week" ADD "classroomAssignmentUrl" text`,
        );
        await queryRunner.query(
            `ALTER TABLE "cohort_week" ADD "classroomAssignmentId" text`,
        );
        await queryRunner.query(
            `ALTER TABLE "cohort_week" DROP COLUMN "classroomUrl"`,
        );
        await queryRunner.query(
            `ALTER TABLE "exercise_score" ADD "classroomRepositoryUrl" text`,
        );
        await queryRunner.query(
            `UPDATE cohort SET "classroomId" = '255956' WHERE type = 'BITCOIN_PROTOCOL_DEVELOPMENT'`,
        );
        await queryRunner.query(
            `UPDATE cohort SET "classroomId" = '300036' WHERE type = 'MASTERING_LIGHTNING_NETWORK'`,
        );

        await queryRunner.query(
            `UPDATE cohort SET "classroomId" = '234007' WHERE type = 'LEARNING_BITCOIN_FROM_COMMAND_LINE'`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "exercise_score" DROP COLUMN "classroomRepositoryUrl"`,
        );
        await queryRunner.query(
            `ALTER TABLE "cohort_week" ADD "classroomUrl" text`,
        );
        await queryRunner.query(
            `ALTER TABLE "cohort_week" DROP COLUMN "classroomAssignmentId"`,
        );
        await queryRunner.query(
            `ALTER TABLE "cohort_week" DROP COLUMN "classroomAssignmentUrl"`,
        );
        await queryRunner.query(
            `ALTER TABLE "cohort" DROP COLUMN "classroomId"`,
        );
    }
}
