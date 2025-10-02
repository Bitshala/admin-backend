import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migrations1759429728965 implements MigrationInterface {
    name = 'Migrations1759429728965';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TYPE "public"."cohort_waitlist_type_enum" AS ENUM('MASTERING_BITCOIN', 'LEARNING_BITCOIN_FROM_COMMAND_LINE', 'PROGRAMMING_BITCOIN', 'BITCOIN_PROTOCOL_DEVELOPMENT')`,
        );
        await queryRunner.query(
            `CREATE TABLE "cohort_waitlist" ("createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" "public"."cohort_waitlist_type_enum" NOT NULL, "userId" uuid, CONSTRAINT "PK_9b44ca0cee3ae4fdcf6f1f602db" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `ALTER TABLE "cohort_waitlist" ADD CONSTRAINT "FK_9ddf6d375a45e856bb09af03315" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "cohort_waitlist" DROP CONSTRAINT "FK_9ddf6d375a45e856bb09af03315"`,
        );
        await queryRunner.query(`DROP TABLE "cohort_waitlist"`);
        await queryRunner.query(
            `DROP TYPE "public"."cohort_waitlist_type_enum"`,
        );
    }
}
