import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migrations1756812875027 implements MigrationInterface {
    name = 'Migrations1756812875027';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE "group_discussion_score" ("createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "attendance" boolean NOT NULL DEFAULT false, "communicationScore" integer NOT NULL DEFAULT '0', "maxCommunicationScore" integer NOT NULL DEFAULT '5', "depthOfAnswerScore" integer NOT NULL DEFAULT '0', "maxDepthOfAnswerScore" integer NOT NULL DEFAULT '5', "technicalBitcoinFluencyScore" integer NOT NULL DEFAULT '0', "maxTechnicalBitcoinFluencyScore" integer NOT NULL DEFAULT '5', "engagementScore" integer NOT NULL DEFAULT '0', "maxEngagementScore" integer NOT NULL DEFAULT '5', "isBonusAttempted" boolean NOT NULL DEFAULT false, "bonusAnswerScore" integer NOT NULL DEFAULT '0', "maxBonusAnswerScore" integer NOT NULL DEFAULT '5', "bonusFollowupScore" integer NOT NULL DEFAULT '0', "maxBonusFollowupScore" integer NOT NULL DEFAULT '5', "userId" uuid, "cohortId" uuid, "cohortWeekId" uuid, CONSTRAINT "PK_898dae52e1711bdd369660d2420" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `CREATE TABLE "exercise_score" ("createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "isSubmitted" boolean NOT NULL DEFAULT false, "isPassing" boolean NOT NULL DEFAULT false, "hasGoodDocumentation" boolean NOT NULL DEFAULT false, "hasGoodStructure" boolean NOT NULL DEFAULT false, "userId" uuid, "cohortId" uuid, "cohortWeekId" uuid, CONSTRAINT "PK_f77e0f6be372e02a68cb022a831" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `CREATE TABLE "cohort_week" ("createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "week" integer NOT NULL, "questions" jsonb, "bonusQuestion" jsonb, "classroomUrl" text, "classroomInviteLink" text, "cohortId" uuid, CONSTRAINT "UQ_80966277bdad8bf191c41f1d0f7" UNIQUE ("cohortId", "week"), CONSTRAINT "PK_4e0e272c0636730dab682173dc0" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `CREATE TYPE "public"."cohort_type_enum" AS ENUM('MASTERING_BITCOIN', 'LEARNING_BITCOIN_FROM_COMMAND_LINE', 'PROGRAMMING_BITCOIN', 'BITCOIN_PROTOCOL_DEVELOPMENT')`,
        );
        await queryRunner.query(
            `CREATE TABLE "cohort" ("createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" "public"."cohort_type_enum" NOT NULL, "season" integer NOT NULL, "registrationDeadline" TIMESTAMP WITH TIME ZONE NOT NULL, "startDate" TIMESTAMP WITH TIME ZONE NOT NULL, "endDate" TIMESTAMP WITH TIME ZONE NOT NULL, CONSTRAINT "UQ_a860e1ecc64320f49cfbcb795db" UNIQUE ("type", "season"), CONSTRAINT "PK_4fb3cca38dc4b461110344e5f9b" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `CREATE TYPE "public"."user_role_enum" AS ENUM('ADMIN', 'TEACHING_ASSISTANT', 'STUDENT')`,
        );
        await queryRunner.query(
            `CREATE TABLE "user" ("createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" text NOT NULL, "discordUserId" text NOT NULL, "discordUserName" text NOT NULL, "discordGlobalName" text, "name" character varying, "role" "public"."user_role_enum" NOT NULL, "description" character varying, CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"), CONSTRAINT "UQ_eab11953198745b2e03be12ee56" UNIQUE ("discordUserId"), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `ALTER TABLE "group_discussion_score" ADD CONSTRAINT "FK_5f23cbe202b8ed8c0dfc7c08041" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "group_discussion_score" ADD CONSTRAINT "FK_c17d08fb98f153fb2085e418f70" FOREIGN KEY ("cohortId") REFERENCES "cohort"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "group_discussion_score" ADD CONSTRAINT "FK_4d324187185a495c49c6e664dbd" FOREIGN KEY ("cohortWeekId") REFERENCES "cohort_week"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "exercise_score" ADD CONSTRAINT "FK_06c4d83eb732f3057cef86b55d5" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "exercise_score" ADD CONSTRAINT "FK_098af60d792d0e2099c742869a0" FOREIGN KEY ("cohortId") REFERENCES "cohort"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "exercise_score" ADD CONSTRAINT "FK_133662ce47c868a59f63e5bbde3" FOREIGN KEY ("cohortWeekId") REFERENCES "cohort_week"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "cohort_week" ADD CONSTRAINT "FK_f2bdb768f5b5e75d9c68b09b525" FOREIGN KEY ("cohortId") REFERENCES "cohort"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "cohort_week" DROP CONSTRAINT "FK_f2bdb768f5b5e75d9c68b09b525"`,
        );
        await queryRunner.query(
            `ALTER TABLE "exercise_score" DROP CONSTRAINT "FK_133662ce47c868a59f63e5bbde3"`,
        );
        await queryRunner.query(
            `ALTER TABLE "exercise_score" DROP CONSTRAINT "FK_098af60d792d0e2099c742869a0"`,
        );
        await queryRunner.query(
            `ALTER TABLE "exercise_score" DROP CONSTRAINT "FK_06c4d83eb732f3057cef86b55d5"`,
        );
        await queryRunner.query(
            `ALTER TABLE "group_discussion_score" DROP CONSTRAINT "FK_4d324187185a495c49c6e664dbd"`,
        );
        await queryRunner.query(
            `ALTER TABLE "group_discussion_score" DROP CONSTRAINT "FK_c17d08fb98f153fb2085e418f70"`,
        );
        await queryRunner.query(
            `ALTER TABLE "group_discussion_score" DROP CONSTRAINT "FK_5f23cbe202b8ed8c0dfc7c08041"`,
        );
        await queryRunner.query(`DROP TABLE "user"`);
        await queryRunner.query(`DROP TYPE "public"."user_role_enum"`);
        await queryRunner.query(`DROP TABLE "cohort"`);
        await queryRunner.query(`DROP TYPE "public"."cohort_type_enum"`);
        await queryRunner.query(`DROP TABLE "cohort_week"`);
        await queryRunner.query(`DROP TABLE "exercise_score"`);
        await queryRunner.query(`DROP TABLE "group_discussion_score"`);
    }
}
