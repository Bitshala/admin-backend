import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migrations1759551388189 implements MigrationInterface {
    name = 'Migrations1759551388189';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "user" ALTER COLUMN "email" DROP NOT NULL`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "user" ALTER COLUMN "email" SET NOT NULL`,
        );
    }
}
