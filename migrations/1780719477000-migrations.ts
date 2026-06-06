import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migrations1780719477000 implements MigrationInterface {
    name = 'Migrations1780719477000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "user" ADD "portfolioUrl" character varying(2048)`,
        );
        await queryRunner.query(
            `ALTER TABLE "user" ADD "linkedinProfileUrl" character varying(2048)`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "user" DROP COLUMN "linkedinProfileUrl"`,
        );
        await queryRunner.query(
            `ALTER TABLE "user" DROP COLUMN "portfolioUrl"`,
        );
    }
}
