import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migrations1784812680498 implements MigrationInterface {
    name = 'Migrations1784812680498';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TYPE "public"."cohort_type_enum" RENAME VALUE 'RUST_FOR_BITCOIN' TO 'BUILDING_BITCOIN_IN_RUST'`,
        );
        await queryRunner.query(
            `ALTER TYPE "public"."cohort_waitlist_type_enum" RENAME VALUE 'RUST_FOR_BITCOIN' TO 'BUILDING_BITCOIN_IN_RUST'`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TYPE "public"."cohort_waitlist_type_enum" RENAME VALUE 'BUILDING_BITCOIN_IN_RUST' TO 'RUST_FOR_BITCOIN'`,
        );
        await queryRunner.query(
            `ALTER TYPE "public"."cohort_type_enum" RENAME VALUE 'BUILDING_BITCOIN_IN_RUST' TO 'RUST_FOR_BITCOIN'`,
        );
    }
}
