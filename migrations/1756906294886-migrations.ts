import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migrations1756906294886 implements MigrationInterface {
    name = 'Migrations1756906294886';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "cohort_week" ALTER COLUMN "questions" SET DEFAULT '[]'`,
        );
        await queryRunner.query(
            `ALTER TABLE "cohort_week" ALTER COLUMN "questions" SET NOT NULL`,
        );
        await queryRunner.query(
            `ALTER TABLE "cohort_week" ALTER COLUMN "bonusQuestion" SET DEFAULT '[]'`,
        );
        await queryRunner.query(
            `ALTER TABLE "cohort_week" ALTER COLUMN "bonusQuestion" SET NOT NULL`,
        );
        await queryRunner.query(
            `CREATE TABLE "cohort_users_user" ("cohortId" uuid NOT NULL, "userId" uuid NOT NULL, CONSTRAINT "PK_fb7a155bfbf3d851a9c1d339baf" PRIMARY KEY ("cohortId", "userId"))`,
        );
        await queryRunner.query(
            `ALTER TABLE "cohort_users_user" ADD CONSTRAINT "FK_5ad31e5243d25fde6c4763ff7b0" FOREIGN KEY ("cohortId") REFERENCES "cohort"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
        );
        await queryRunner.query(
            `ALTER TABLE "cohort_users_user" ADD CONSTRAINT "FK_2d63195132b5a87b18419994ffc" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "cohort_users_user" DROP CONSTRAINT "FK_2d63195132b5a87b18419994ffc"`,
        );
        await queryRunner.query(
            `ALTER TABLE "cohort_users_user" DROP CONSTRAINT "FK_5ad31e5243d25fde6c4763ff7b0"`,
        );
        await queryRunner.query(`DROP TABLE "cohort_users_user"`);
        await queryRunner.query(
            `ALTER TABLE "cohort_week" ALTER COLUMN "bonusQuestion" DROP NOT NULL`,
        );
        await queryRunner.query(
            `ALTER TABLE "cohort_week" ALTER COLUMN "bonusQuestion" DROP DEFAULT`,
        );
        await queryRunner.query(
            `ALTER TABLE "cohort_week" ALTER COLUMN "questions" DROP NOT NULL`,
        );
        await queryRunner.query(
            `ALTER TABLE "cohort_week" ALTER COLUMN "questions" DROP DEFAULT`,
        );
    }
}
