import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migrations1786525636000 implements MigrationInterface {
    name = 'Migrations1786525636000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TYPE "public"."fellowship_application_educationcategory_enum" AS ENUM('MEETUP', 'CLUB', 'COHORT_TA', 'OTHER')`,
        );
        await queryRunner.query(
            `CREATE TYPE "public"."fellowship_application_cohorttype_enum" AS ENUM('MASTERING_BITCOIN', 'LEARNING_BITCOIN_FROM_COMMAND_LINE', 'PROGRAMMING_BITCOIN', 'BITCOIN_PROTOCOL_DEVELOPMENT', 'MASTERING_LIGHTNING_NETWORK', 'BUILDING_BITCOIN_IN_RUST')`,
        );
        await queryRunner.query(
            `ALTER TABLE "fellowship_application" ADD "educationCategory" "public"."fellowship_application_educationcategory_enum"`,
        );
        await queryRunner.query(
            `ALTER TABLE "fellowship_application" ADD "cohortType" "public"."fellowship_application_cohorttype_enum"`,
        );
        await queryRunner.query(
            `ALTER TABLE "fellowship_application" ADD "city" text`,
        );
        await queryRunner.query(
            `ALTER TABLE "fellowship_application" ADD "educationCategoryOther" text`,
        );
        await queryRunner.query(
            `ALTER TABLE "fellowship_application" ADD "scopeOfWork" text`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "fellowship_application" DROP COLUMN "scopeOfWork"`,
        );
        await queryRunner.query(
            `ALTER TABLE "fellowship_application" DROP COLUMN "educationCategoryOther"`,
        );
        await queryRunner.query(
            `ALTER TABLE "fellowship_application" DROP COLUMN "city"`,
        );
        await queryRunner.query(
            `ALTER TABLE "fellowship_application" DROP COLUMN "cohortType"`,
        );
        await queryRunner.query(
            `ALTER TABLE "fellowship_application" DROP COLUMN "educationCategory"`,
        );
        await queryRunner.query(
            `DROP TYPE "public"."fellowship_application_cohorttype_enum"`,
        );
        await queryRunner.query(
            `DROP TYPE "public"."fellowship_application_educationcategory_enum"`,
        );
    }
}
