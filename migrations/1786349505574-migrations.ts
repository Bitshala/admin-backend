import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migrations1786349505574 implements MigrationInterface {
    name = 'Migrations1786349505574';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE "fellowship_report_note" ("createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "body" text NOT NULL, "reportId" uuid, "authorId" uuid, CONSTRAINT "PK_9c4fd7c8d184cb074597bddb015" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `ALTER TABLE "fellowship_report_note" ADD CONSTRAINT "FK_1a587c4a095b42730afc09c125d" FOREIGN KEY ("reportId") REFERENCES "fellowship_report"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "fellowship_report_note" ADD CONSTRAINT "FK_56c8dcb3be26c0a1b19e4fdac57" FOREIGN KEY ("authorId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "fellowship_report_note" DROP CONSTRAINT "FK_56c8dcb3be26c0a1b19e4fdac57"`,
        );
        await queryRunner.query(
            `ALTER TABLE "fellowship_report_note" DROP CONSTRAINT "FK_1a587c4a095b42730afc09c125d"`,
        );
        await queryRunner.query(`DROP TABLE "fellowship_report_note"`);
    }
}
