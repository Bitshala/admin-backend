import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migrations1786349505574 implements MigrationInterface {
    name = 'Migrations1786349505574';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE "fellowship_report_note" ("createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "body" text NOT NULL, "reportId" uuid, "authorId" uuid, CONSTRAINT "PK_fellowship_report_note" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `ALTER TABLE "fellowship_report_note" ADD CONSTRAINT "FK_fellowship_report_note_report" FOREIGN KEY ("reportId") REFERENCES "fellowship_report"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "fellowship_report_note" ADD CONSTRAINT "FK_fellowship_report_note_author" FOREIGN KEY ("authorId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "fellowship_report_note" DROP CONSTRAINT "FK_fellowship_report_note_author"`,
        );
        await queryRunner.query(
            `ALTER TABLE "fellowship_report_note" DROP CONSTRAINT "FK_fellowship_report_note_report"`,
        );
        await queryRunner.query(`DROP TABLE "fellowship_report_note"`);
    }
}
