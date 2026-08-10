import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migrations1786377793901 implements MigrationInterface {
    name = 'Migrations1786377793901';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TYPE "public"."fellowship_kind_enum" AS ENUM('FELLOWSHIP', 'STARTER_GRANT')`,
        );
        await queryRunner.query(
            `ALTER TABLE "fellowship" ADD "kind" "public"."fellowship_kind_enum" NOT NULL DEFAULT 'FELLOWSHIP'`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "fellowship" DROP COLUMN "kind"`);
        await queryRunner.query(`DROP TYPE "public"."fellowship_kind_enum"`);
    }
}
