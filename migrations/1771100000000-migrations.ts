import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migrations1771100000000 implements MigrationInterface {
    name = 'Migrations1771100000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "cohort" ADD "classroomId" integer`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "cohort" DROP COLUMN "classroomId"`,
        );
    }
}
