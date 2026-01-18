import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migrations1768747762360 implements MigrationInterface {
    name = 'Migrations1768747762360';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TYPE "public"."certificate_type_enum" AS ENUM('PARTICIPANT', 'PERFORMER')`,
        );
        await queryRunner.query(
            `CREATE TABLE "certificate" ("createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" "public"."certificate_type_enum" NOT NULL, "name" character varying NOT NULL, "cohortId" uuid, "userId" uuid, CONSTRAINT "UQ_ce0a1cd03bc5fb0b847ffe13b7f" UNIQUE ("cohortId", "userId"), CONSTRAINT "PK_8daddfc65f59e341c2bbc9c9e43" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `ALTER TABLE "certificate" ADD CONSTRAINT "FK_e03b5953e18409519eb82ebc98d" FOREIGN KEY ("cohortId") REFERENCES "cohort"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "certificate" ADD CONSTRAINT "FK_52422eba9e5b9d779d3e173a25d" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "certificate" DROP CONSTRAINT "FK_52422eba9e5b9d779d3e173a25d"`,
        );
        await queryRunner.query(
            `ALTER TABLE "certificate" DROP CONSTRAINT "FK_e03b5953e18409519eb82ebc98d"`,
        );
        await queryRunner.query(`DROP TABLE "certificate"`);
        await queryRunner.query(`DROP TYPE "public"."certificate_type_enum"`);
    }
}
