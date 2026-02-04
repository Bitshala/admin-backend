import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migrations1770217583058 implements MigrationInterface {
    name = 'Migrations1770217583058';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "certificate" ADD "withExercises" boolean NOT NULL`,
        );
        await queryRunner.query(
            `CREATE TYPE "public"."certificate_rank_enum" AS ENUM('1', '2', '3')`,
        );
        await queryRunner.query(
            `ALTER TABLE "certificate" ADD "rank" "public"."certificate_rank_enum"`,
        );
        await queryRunner.query(
            `ALTER TABLE "certificate" ADD CONSTRAINT "CHK_4410d90fe7c4f0fab19dac8c02" CHECK ("type" != 'PERFORMER' OR "rank" IS NOT NULL)`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "certificate" DROP CONSTRAINT "CHK_4410d90fe7c4f0fab19dac8c02"`,
        );
        await queryRunner.query(`ALTER TABLE "certificate" DROP COLUMN "rank"`);
        await queryRunner.query(`DROP TYPE "public"."certificate_rank_enum"`);
        await queryRunner.query(
            `ALTER TABLE "certificate" DROP COLUMN "withExercises"`,
        );
    }
}
