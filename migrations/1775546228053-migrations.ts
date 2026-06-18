import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migrations1775546228053 implements MigrationInterface {
    name = 'Migrations1775546228053';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TYPE "public"."fellowship_type_enum" AS ENUM('DEVELOPER', 'DESIGNER', 'EDUCATOR')`,
        );
        await queryRunner.query(
            `CREATE TYPE "public"."fellowship_status_enum" AS ENUM('PENDING', 'AWAITING_DOCUMENTS', 'DOCUMENTS_IN_REVIEW', 'DOCUMENTS_APPROVED', 'ACTIVE', 'COMPLETED')`,
        );
        await queryRunner.query(
            `CREATE TABLE "fellowship" ("createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" "public"."fellowship_type_enum" NOT NULL, "status" "public"."fellowship_status_enum" NOT NULL DEFAULT 'PENDING', "startDate" TIMESTAMP WITH TIME ZONE, "endDate" TIMESTAMP WITH TIME ZONE, "amountUsd" numeric(10,2), "driveFolderUrl" text, "userId" uuid, "applicationId" uuid, CONSTRAINT "REL_ecc546fbfc8499e66a948e34d0" UNIQUE ("applicationId"), CONSTRAINT "PK_7cab81bcfea36e9b6aa5a9bd24a" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `CREATE TYPE "public"."fellowship_application_type_enum" AS ENUM('DEVELOPER', 'DESIGNER', 'EDUCATOR')`,
        );
        await queryRunner.query(
            `CREATE TYPE "public"."fellowship_application_status_enum" AS ENUM('DRAFT', 'SUBMITTED', 'CHANGES_REQUESTED', 'ACCEPTED', 'REJECTED')`,
        );
        await queryRunner.query(
            `CREATE TABLE "fellowship_application" ("createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" "public"."fellowship_application_type_enum" NOT NULL, "title" text, "problemStatement" text, "plan" text, "mentorName" text, "mentorContact" text, "mentorTestimonial" text, "github" text, "links" text array NOT NULL DEFAULT '{}', "projectName" text, "projectGithubLink" text, "academicBackground" text, "graduationYear" integer, "professionalExperience" text, "domains" jsonb, "codingLanguages" jsonb, "educationInterests" jsonb, "bitcoinContributions" text, "bitcoinMotivation" text, "bitcoinOssGoal" text, "additionalInfo" text, "questionsForBitshala" text, "status" "public"."fellowship_application_status_enum" NOT NULL, "reviewerRemarks" text, "driveFolderId" text, "applicantId" uuid, "reviewedById" uuid, CONSTRAINT "PK_d7f9f34e7d0af11c969d9ca7365" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `ALTER TABLE "fellowship" ADD CONSTRAINT "FK_701281b1d831e1dc2fc28a065b4" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "fellowship" ADD CONSTRAINT "FK_ecc546fbfc8499e66a948e34d0c" FOREIGN KEY ("applicationId") REFERENCES "fellowship_application"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "fellowship_application" ADD CONSTRAINT "FK_9ff76720d9629513dcdd5fb34e4" FOREIGN KEY ("applicantId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "fellowship_application" ADD CONSTRAINT "FK_1a11e17efd19f0a5bb79e4dcb66" FOREIGN KEY ("reviewedById") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `CREATE TABLE "fellowship_application_note" ("createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "body" text NOT NULL, "applicationId" uuid, "authorId" uuid, CONSTRAINT "PK_fellowship_application_note" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `ALTER TABLE "fellowship_application_note" ADD CONSTRAINT "FK_ea8e1808f1745730e42ee49b167" FOREIGN KEY ("applicationId") REFERENCES "fellowship_application"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "fellowship_application_note" ADD CONSTRAINT "FK_279349cab9bf5a4d2300159b750" FOREIGN KEY ("authorId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `CREATE TYPE "public"."fellowship_document_type_enum" AS ENUM('UNSIGNED_CONTRACT', 'SIGNED_CONTRACT', 'W8BEN')`,
        );
        await queryRunner.query(
            `CREATE TYPE "public"."fellowship_document_status_enum" AS ENUM('AWAITING_UPLOAD', 'PENDING_REVIEW', 'APPROVED', 'REJECTED')`,
        );
        await queryRunner.query(
            `CREATE TABLE "fellowship_document" ("createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" "public"."fellowship_document_type_enum" NOT NULL, "status" "public"."fellowship_document_status_enum" NOT NULL, "driveFileId" text, "fileName" text, "mimeType" text, "sizeBytes" integer, "rejectionReason" text, "applicationId" uuid, "uploadedById" uuid, "reviewedById" uuid, CONSTRAINT "UQ_92633813253aeb0cbdb1136d741" UNIQUE ("applicationId", "type"), CONSTRAINT "PK_fellowship_document" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `ALTER TABLE "fellowship_document" ADD CONSTRAINT "FK_4de87703835e89d92170d7e5141" FOREIGN KEY ("applicationId") REFERENCES "fellowship_application"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "fellowship_document" ADD CONSTRAINT "FK_1c62729607f6a443df941a07ac1" FOREIGN KEY ("uploadedById") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "fellowship_document" ADD CONSTRAINT "FK_93dff0f9cfe1580833cab3b7482" FOREIGN KEY ("reviewedById") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `CREATE TYPE "public"."fellowship_report_status_enum" AS ENUM('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED')`,
        );
        await queryRunner.query(
            `CREATE TABLE "fellowship_report" ("createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "month" integer NOT NULL, "year" integer NOT NULL, "summary" text NOT NULL DEFAULT '', "links" text array NOT NULL DEFAULT '{}', "challengingWork" text NOT NULL DEFAULT '', "keyLearning" text NOT NULL DEFAULT '', "reviewerFeedback" text NOT NULL DEFAULT '', "growthGoal" text NOT NULL DEFAULT '', "status" "public"."fellowship_report_status_enum" NOT NULL, "reviewerRemarks" text, "fellowshipId" uuid, "reviewedById" uuid, CONSTRAINT "PK_989afa645c643ba3ab5f8a0700b" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `ALTER TABLE "fellowship_report" ADD CONSTRAINT "FK_b05b6cce0d61f864e1ad9228324" FOREIGN KEY ("fellowshipId") REFERENCES "fellowship"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "fellowship_report" ADD CONSTRAINT "FK_b9ed154238aa2cecebac0b638fc" FOREIGN KEY ("reviewedById") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );

        // Seed the first fellowship report reminder task at the next upcoming 20th/25th/28th at 12:00 noon IST (06:30 UTC)
        const now = new Date();
        const year = now.getUTCFullYear();
        const month = now.getUTCMonth(); // 0-indexed
        const day = now.getUTCDate();

        let executeOnTime: Date;
        if (day < 20) {
            executeOnTime = new Date(Date.UTC(year, month, 20, 6, 30, 0));
        } else if (day < 25) {
            executeOnTime = new Date(Date.UTC(year, month, 25, 6, 30, 0));
        } else if (day < 28) {
            executeOnTime = new Date(Date.UTC(year, month, 28, 6, 30, 0));
        } else {
            // Next month's 20th
            executeOnTime = new Date(Date.UTC(year, month + 1, 20, 6, 30, 0));
        }

        const taskMonth = executeOnTime.getUTCMonth() + 1; // 1-indexed
        const taskYear = executeOnTime.getUTCFullYear();

        await queryRunner.query(
            `INSERT INTO "api_task" ("type", "data", "executeOnTime", "status", "retryCount", "retryLimit") VALUES ('SEND_FELLOWSHIP_REPORT_REMINDER_EMAILS', '{"month": ${taskMonth}, "year": ${taskYear}}'::jsonb, '${executeOnTime.toISOString()}'::timestamptz, 'UNPROCESSED', 0, 1)`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `DELETE FROM "api_task" WHERE "type" = 'SEND_FELLOWSHIP_REPORT_REMINDER_EMAILS'`,
        );
        await queryRunner.query(
            `ALTER TABLE "fellowship_application_note" DROP CONSTRAINT "FK_279349cab9bf5a4d2300159b750"`,
        );
        await queryRunner.query(
            `ALTER TABLE "fellowship_application_note" DROP CONSTRAINT "FK_ea8e1808f1745730e42ee49b167"`,
        );
        await queryRunner.query(`DROP TABLE "fellowship_application_note"`);
        await queryRunner.query(
            `ALTER TABLE "fellowship_report" DROP CONSTRAINT "FK_b9ed154238aa2cecebac0b638fc"`,
        );
        await queryRunner.query(
            `ALTER TABLE "fellowship_report" DROP CONSTRAINT "FK_b05b6cce0d61f864e1ad9228324"`,
        );
        await queryRunner.query(`DROP TABLE "fellowship_report"`);
        await queryRunner.query(
            `DROP TYPE "public"."fellowship_report_status_enum"`,
        );
        await queryRunner.query(
            `ALTER TABLE "fellowship_document" DROP CONSTRAINT "FK_93dff0f9cfe1580833cab3b7482"`,
        );
        await queryRunner.query(
            `ALTER TABLE "fellowship_document" DROP CONSTRAINT "FK_1c62729607f6a443df941a07ac1"`,
        );
        await queryRunner.query(
            `ALTER TABLE "fellowship_document" DROP CONSTRAINT "FK_4de87703835e89d92170d7e5141"`,
        );
        await queryRunner.query(`DROP TABLE "fellowship_document"`);
        await queryRunner.query(
            `DROP TYPE "public"."fellowship_document_status_enum"`,
        );
        await queryRunner.query(
            `DROP TYPE "public"."fellowship_document_type_enum"`,
        );
        await queryRunner.query(
            `ALTER TABLE "fellowship_application" DROP CONSTRAINT "FK_1a11e17efd19f0a5bb79e4dcb66"`,
        );
        await queryRunner.query(
            `ALTER TABLE "fellowship_application" DROP CONSTRAINT "FK_9ff76720d9629513dcdd5fb34e4"`,
        );
        await queryRunner.query(
            `ALTER TABLE "fellowship" DROP CONSTRAINT "FK_ecc546fbfc8499e66a948e34d0c"`,
        );
        await queryRunner.query(
            `ALTER TABLE "fellowship" DROP CONSTRAINT "FK_701281b1d831e1dc2fc28a065b4"`,
        );
        await queryRunner.query(`DROP TABLE "fellowship_application"`);
        await queryRunner.query(
            `DROP TYPE "public"."fellowship_application_status_enum"`,
        );
        await queryRunner.query(
            `DROP TYPE "public"."fellowship_application_type_enum"`,
        );
        await queryRunner.query(`DROP TABLE "fellowship"`);
        await queryRunner.query(`DROP TYPE "public"."fellowship_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."fellowship_type_enum"`);
    }
}
