import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migrations1773645534213 implements MigrationInterface {
    name = 'Migrations1773645534213';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "feedback" DROP COLUMN "feedbackText"`,
        );
        await queryRunner.query(`DELETE FROM "feedback"`);
        await queryRunner.query(
            `ALTER TABLE "feedback" ADD "componentRatings" jsonb`,
        );
        await queryRunner.query(
            `ALTER TABLE "feedback" ADD "expectations" text`,
        );
        await queryRunner.query(
            `ALTER TABLE "feedback" ADD "improvements" text`,
        );
        await queryRunner.query(
            `ALTER TABLE "feedback" ADD "opportunityInterests" jsonb NOT NULL DEFAULT '[]'`,
        );
        await queryRunner.query(
            `ALTER TABLE "feedback" ADD "fellowshipInterests" jsonb NOT NULL DEFAULT '[]'`,
        );
        await queryRunner.query(
            `ALTER TABLE "feedback" ADD "idealProject" text`,
        );
        await queryRunner.query(
            `ALTER TABLE "feedback" ADD "testimonial" text`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "feedback" DROP COLUMN "testimonial"`,
        );
        await queryRunner.query(
            `ALTER TABLE "feedback" DROP COLUMN "idealProject"`,
        );
        await queryRunner.query(
            `ALTER TABLE "feedback" DROP COLUMN "fellowshipInterests"`,
        );
        await queryRunner.query(
            `ALTER TABLE "feedback" DROP COLUMN "opportunityInterests"`,
        );
        await queryRunner.query(
            `ALTER TABLE "feedback" DROP COLUMN "improvements"`,
        );
        await queryRunner.query(
            `ALTER TABLE "feedback" DROP COLUMN "expectations"`,
        );
        await queryRunner.query(
            `ALTER TABLE "feedback" DROP COLUMN "componentRatings"`,
        );
        await queryRunner.query(
            `ALTER TABLE "feedback" ADD "feedbackText" text NOT NULL`,
        );
    }
}
