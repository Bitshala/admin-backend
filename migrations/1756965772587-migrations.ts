import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migrations1756965772587 implements MigrationInterface {
    name = 'Migrations1756965772587';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "user" ADD "isGuildMember" boolean NOT NULL DEFAULT false`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "user" DROP COLUMN "isGuildMember"`,
        );
    }
}
