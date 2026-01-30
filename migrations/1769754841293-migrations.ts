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
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "exercise_score" ADD "hasGoodStructure" boolean NOT NULL DEFAULT false`,
        );
        await queryRunner.query(
            `ALTER TABLE "exercise_score" ADD "hasGoodDocumentation" boolean NOT NULL DEFAULT false`,
        );
    }
}
