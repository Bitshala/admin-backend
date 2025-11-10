import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migrations1761573105513 implements MigrationInterface {
    name = 'Migrations1761573105513';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE "feedback" ("createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "feedbackText" text NOT NULL, "userId" uuid NOT NULL, "cohortId" uuid NOT NULL, CONSTRAINT "PK_8389f9e087a57689cd5be8b2b13" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `ALTER TABLE "feedback" ADD CONSTRAINT "FK_4a39e6ac0cecdf18307a365cf3c" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "feedback" ADD CONSTRAINT "FK_482daa0b99bb21d665d41afbbd4" FOREIGN KEY ("cohortId") REFERENCES "cohort"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "feedback" DROP CONSTRAINT "FK_482daa0b99bb21d665d41afbbd4"`,
        );
        await queryRunner.query(
            `ALTER TABLE "feedback" DROP CONSTRAINT "FK_4a39e6ac0cecdf18307a365cf3c"`,
        );
        await queryRunner.query(`DROP TABLE "feedback"`);
    }
}
