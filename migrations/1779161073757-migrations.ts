import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migrations1779161073757 implements MigrationInterface {
    name = 'Migrations1779161073757';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE "cohort_membership" ("createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "discordRoleAssigned" boolean NOT NULL DEFAULT false, "alumniRoleAssigned" boolean NOT NULL DEFAULT false, "userId" uuid, "cohortId" uuid, CONSTRAINT "UQ_ec990a43acf4e6092fa2d4b3531" UNIQUE ("userId", "cohortId"), CONSTRAINT "PK_cohort_membership_id" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `ALTER TABLE "cohort_membership" ADD CONSTRAINT "FK_40811e5719774db9a4e9822ac88" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "cohort_membership" ADD CONSTRAINT "FK_64f6b37244cc628bbb95c2b5a18" FOREIGN KEY ("cohortId") REFERENCES "cohort"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );

        // Backfill existing memberships with discordRoleAssigned = false
        // (the column default), then enqueue a one-shot
        // RECONCILE_COHORT_DISCORD_ROLES task per cohort. The task processor
        // calls Discord to determine the real role state per user, attaches
        // the role if it's missing, and flips the flag to true on success.
        await queryRunner.query(`
            INSERT INTO "cohort_membership" ("userId", "cohortId")
            SELECT "userId", "cohortId" FROM "cohort_users_user"
        `);

        // Stagger the initial reconciliation tasks 5 minutes apart so we
        // process one cohort at a time and don't hammer the Discord API.
        // Subsequent runs (scheduled by the task handler at +24h) preserve
        // this staggering naturally.
        await queryRunner.query(`
            INSERT INTO "api_task" ("type", "data", "executeOnTime")
            SELECT
                'RECONCILE_COHORT_DISCORD_ROLES',
                jsonb_build_object('cohortId', c."id"),
                NOW() + ((ROW_NUMBER() OVER (ORDER BY c."createdAt") - 1) * INTERVAL '5 minutes')
            FROM "cohort" c
        `);

        // Backfill: one ASSIGN_COHORT_ALUMNI_ROLE task per cohort that has
        // existing certificates. The handler iterates cert holders and
        // assigns the alumni role per-user, swallowing per-user failures
        // (left-the-guild, etc.). Staggered 5 minutes apart for the same
        // reason as the reconciliation tasks above.
        await queryRunner.query(`
            INSERT INTO "api_task" ("type", "data", "executeOnTime")
            SELECT
                'ASSIGN_COHORT_ALUMNI_ROLE',
                jsonb_build_object('cohortId', sub."cohortId"),
                NOW() + ((ROW_NUMBER() OVER (ORDER BY sub."cohortId") - 1) * INTERVAL '5 minutes')
            FROM (
                SELECT DISTINCT c."cohortId"
                FROM "certificate" c
            ) sub
        `);

        await queryRunner.query(
            `ALTER TABLE "cohort_users_user" DROP CONSTRAINT "FK_2d63195132b5a87b18419994ffc"`,
        );
        await queryRunner.query(
            `ALTER TABLE "cohort_users_user" DROP CONSTRAINT "FK_5ad31e5243d25fde6c4763ff7b0"`,
        );
        await queryRunner.query(
            `DROP INDEX "public"."IDX_2d63195132b5a87b18419994ff"`,
        );
        await queryRunner.query(
            `DROP INDEX "public"."IDX_5ad31e5243d25fde6c4763ff7b"`,
        );
        await queryRunner.query(`DROP TABLE "cohort_users_user"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Cancel any pending reconciliation and alumni-role tasks (their
        // handlers are removed in the reverted code).
        await queryRunner.query(
            `UPDATE "api_task" SET "status" = 'CANCELLED' WHERE "type" IN ('RECONCILE_COHORT_DISCORD_ROLES', 'ASSIGN_COHORT_ALUMNI_ROLE') AND "status" IN ('UNPROCESSED', 'FAILED')`,
        );

        await queryRunner.query(
            `CREATE TABLE "cohort_users_user" ("cohortId" uuid NOT NULL, "userId" uuid NOT NULL, CONSTRAINT "PK_fb7a155bfbf3d851a9c1d339baf" PRIMARY KEY ("cohortId", "userId"))`,
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_5ad31e5243d25fde6c4763ff7b" ON "cohort_users_user" ("cohortId") `,
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_2d63195132b5a87b18419994ff" ON "cohort_users_user" ("userId") `,
        );
        await queryRunner.query(
            `ALTER TABLE "cohort_users_user" ADD CONSTRAINT "FK_5ad31e5243d25fde6c4763ff7b0" FOREIGN KEY ("cohortId") REFERENCES "cohort"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
        );
        await queryRunner.query(
            `ALTER TABLE "cohort_users_user" ADD CONSTRAINT "FK_2d63195132b5a87b18419994ffc" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );

        await queryRunner.query(
            `INSERT INTO "cohort_users_user" ("cohortId", "userId") SELECT "cohortId", "userId" FROM "cohort_membership" WHERE "cohortId" IS NOT NULL AND "userId" IS NOT NULL`,
        );

        await queryRunner.query(
            `ALTER TABLE "cohort_membership" DROP CONSTRAINT "FK_64f6b37244cc628bbb95c2b5a18"`,
        );
        await queryRunner.query(
            `ALTER TABLE "cohort_membership" DROP CONSTRAINT "FK_40811e5719774db9a4e9822ac88"`,
        );
        await queryRunner.query(`DROP TABLE "cohort_membership"`);
    }
}
