import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migrations1779161073757 implements MigrationInterface {
    name = 'Migrations1779161073757';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE "cohort_membership" ("createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "discordRoleAssigned" boolean NOT NULL DEFAULT false, "userId" uuid, "cohortId" uuid, CONSTRAINT "UQ_cohort_membership_user_cohort" UNIQUE ("userId", "cohortId"), CONSTRAINT "PK_cohort_membership_id" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `ALTER TABLE "cohort_membership" ADD CONSTRAINT "FK_cohort_membership_user" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "cohort_membership" ADD CONSTRAINT "FK_cohort_membership_cohort" FOREIGN KEY ("cohortId") REFERENCES "cohort"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );

        // Backfill existing memberships. discordRoleAssigned defaults to true
        // for historical rows — we assume previously enrolled users already
        // have their Discord cohort role.
        await queryRunner.query(
            `INSERT INTO "cohort_membership" ("userId", "cohortId", "discordRoleAssigned") SELECT "userId", "cohortId", true FROM "cohort_users_user"`,
        );

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
            `ALTER TABLE "cohort_membership" DROP CONSTRAINT "FK_cohort_membership_cohort"`,
        );
        await queryRunner.query(
            `ALTER TABLE "cohort_membership" DROP CONSTRAINT "FK_cohort_membership_user"`,
        );
        await queryRunner.query(`DROP TABLE "cohort_membership"`);
    }
}
