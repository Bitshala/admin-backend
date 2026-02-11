import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migrations1770792827251 implements MigrationInterface {
    name = 'Migrations1770792827251';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "cohort_week" ADD "classroomAssignmentId" integer`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "cohort_week" DROP COLUMN "classroomAssignmentId"`,
        );
    }
}
