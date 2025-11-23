import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migrations1763926688417 implements MigrationInterface {
    name = 'Migrations1763926688417';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TYPE "public"."cohort_type_enum" ADD VALUE 'MASTERING_LIGHTNING_NETWORK'`,
        );
        await queryRunner.query(
            `ALTER TYPE "public"."cohort_waitlist_type_enum" ADD VALUE 'MASTERING_LIGHTNING_NETWORK'`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "cohort" DROP CONSTRAINT "UQ_a860e1ecc64320f49cfbcb795db"`,
        );
        await queryRunner.query(
            `CREATE TYPE "public"."cohort_waitlist_type_enum_old" AS ENUM('MASTERING_BITCOIN', 'LEARNING_BITCOIN_FROM_COMMAND_LINE', 'PROGRAMMING_BITCOIN', 'BITCOIN_PROTOCOL_DEVELOPMENT')`,
        );
        await queryRunner.query(
            `ALTER TABLE "cohort_waitlist" ALTER COLUMN "type" TYPE "public"."cohort_waitlist_type_enum_old" USING "type"::"text"::"public"."cohort_waitlist_type_enum_old"`,
        );
        await queryRunner.query(
            `DROP TYPE "public"."cohort_waitlist_type_enum"`,
        );
        await queryRunner.query(
            `ALTER TYPE "public"."cohort_waitlist_type_enum_old" RENAME TO "cohort_waitlist_type_enum"`,
        );
        await queryRunner.query(
            `CREATE TYPE "public"."cohort_type_enum_old" AS ENUM('MASTERING_BITCOIN', 'LEARNING_BITCOIN_FROM_COMMAND_LINE', 'PROGRAMMING_BITCOIN', 'BITCOIN_PROTOCOL_DEVELOPMENT')`,
        );
        await queryRunner.query(
            `ALTER TABLE "cohort" ALTER COLUMN "type" TYPE "public"."cohort_type_enum_old" USING "type"::"text"::"public"."cohort_type_enum_old"`,
        );
        await queryRunner.query(`DROP TYPE "public"."cohort_type_enum"`);
        await queryRunner.query(
            `ALTER TYPE "public"."cohort_type_enum_old" RENAME TO "cohort_type_enum"`,
        );
        await queryRunner.query(
            `ALTER TABLE "cohort" ADD CONSTRAINT "UQ_a860e1ecc64320f49cfbcb795db" UNIQUE ("season", "type")`,
        );
    }
}
