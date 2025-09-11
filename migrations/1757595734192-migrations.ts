import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migrations1757595734192 implements MigrationInterface {
    name = 'Migrations1757595734192';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" ADD "background" text`);
        await queryRunner.query(
            `ALTER TABLE "user" ADD "githubProfileUrl" character varying(2048)`,
        );
        await queryRunner.query(
            `ALTER TABLE "user" ADD "skills" jsonb NOT NULL DEFAULT '[]'`,
        );
        await queryRunner.query(
            `ALTER TABLE "user" ADD "firstHeardAboutBitcoinOn" date`,
        );
        await queryRunner.query(
            `ALTER TABLE "user" ADD "bitcoinBooksRead" jsonb NOT NULL DEFAULT '[]'`,
        );
        await queryRunner.query(`ALTER TABLE "user" ADD "whyBitcoin" text`);
        await queryRunner.query(
            `ALTER TABLE "user" ADD "weeklyCohortCommitmentHours" integer`,
        );
        await queryRunner.query(
            `ALTER TABLE "user" ADD "location" character varying(255)`,
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_5ad31e5243d25fde6c4763ff7b" ON "cohort_users_user" ("cohortId") `,
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_2d63195132b5a87b18419994ff" ON "cohort_users_user" ("userId") `,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `DROP INDEX "public"."IDX_2d63195132b5a87b18419994ff"`,
        );
        await queryRunner.query(
            `DROP INDEX "public"."IDX_5ad31e5243d25fde6c4763ff7b"`,
        );
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "location"`);
        await queryRunner.query(
            `ALTER TABLE "user" DROP COLUMN "weeklyCohortCommitmentHours"`,
        );
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "whyBitcoin"`);
        await queryRunner.query(
            `ALTER TABLE "user" DROP COLUMN "bitcoinBooksRead"`,
        );
        await queryRunner.query(
            `ALTER TABLE "user" DROP COLUMN "firstHeardAboutBitcoinOn"`,
        );
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "skills"`);
        await queryRunner.query(
            `ALTER TABLE "user" DROP COLUMN "githubProfileUrl"`,
        );
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "background"`);
    }
}
