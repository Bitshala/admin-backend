import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migrations1771586954751 implements MigrationInterface {
    name = 'Migrations1771586954751';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE "attendance" ("createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "attended" boolean NOT NULL DEFAULT false, "userId" uuid, "cohortId" uuid, "cohortWeekId" uuid, CONSTRAINT "UQ_3550ba8f3693c3ca6084c75ad79" UNIQUE ("userId", "cohortId", "cohortWeekId"), CONSTRAINT "PK_ee0ffe42c1f1a01e72b725c0cb2" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `ALTER TABLE "attendance" ADD CONSTRAINT "FK_466e85b813d871bfb693f443528" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "attendance" ADD CONSTRAINT "FK_107dc8f663f65bf27849d055eb8" FOREIGN KEY ("cohortId") REFERENCES "cohort"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "attendance" ADD CONSTRAINT "FK_fa0fb109856091d778ee8ec5ce6" FOREIGN KEY ("cohortWeekId") REFERENCES "cohort_week"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );

        // Migrate existing attendance data from group_discussion_score to attendance
        await queryRunner.query(
            `INSERT INTO "attendance" ("userId", "cohortId", "cohortWeekId", "attended")
            SELECT "userId", "cohortId", "cohortWeekId", "attendance" FROM "group_discussion_score"`,
        );
        // Delete GD records for week 0 (no longer needed)
        await queryRunner.query(
            `DELETE FROM "group_discussion_score" WHERE "cohortWeekId" IN (
                 SELECT "id" FROM "cohort_week" WHERE "week" = 0
             )`,
        );
        // Delete exercise records for week 0 (no longer needed)
        await queryRunner.query(
            `DELETE FROM "exercise_score" WHERE "cohortWeekId" IN (
                 SELECT "id" FROM "cohort_week" WHERE "week" = 0
             )`,
        );

        await queryRunner.query(
            `ALTER TABLE "group_discussion_score" DROP COLUMN "attendance"`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "group_discussion_score" ADD "attendance" boolean NOT NULL DEFAULT false`,
        );

        // Re-create GD records for week 0 from attendance data
        await queryRunner.query(
            `INSERT INTO "group_discussion_score" ("userId", "cohortId", "cohortWeekId", "attendance")
             SELECT a."userId", a."cohortId", a."cohortWeekId", a."attended" FROM "attendance" a
             INNER JOIN "cohort_week" cw ON cw."id" = a."cohortWeekId"
             WHERE cw."week" = 0`,
        );
        // Restore attendance data from attendance table back to group_discussion_score
        await queryRunner.query(
            `UPDATE "group_discussion_score" gds SET "attendance" = a."attended" FROM "attendance" a
            WHERE gds."userId" = a."userId" AND gds."cohortId" = a."cohortId" AND gds."cohortWeekId" = a."cohortWeekId"`,
        );

        await queryRunner.query(
            `ALTER TABLE "attendance" DROP CONSTRAINT "FK_fa0fb109856091d778ee8ec5ce6"`,
        );
        await queryRunner.query(
            `ALTER TABLE "attendance" DROP CONSTRAINT "FK_107dc8f663f65bf27849d055eb8"`,
        );
        await queryRunner.query(
            `ALTER TABLE "attendance" DROP CONSTRAINT "FK_466e85b813d871bfb693f443528"`,
        );
        await queryRunner.query(`DROP TABLE "attendance"`);
    }
}
