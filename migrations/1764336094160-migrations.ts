import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migrations1764336094160 implements MigrationInterface {
    name = 'Migrations1764336094160';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "group_discussion_score" ADD "assignedTeachingAssistantId" uuid`,
        );
        await queryRunner.query(
            `ALTER TABLE "group_discussion_score" ADD CONSTRAINT "FK_3982e593245f01e4d8f4155ef5b" FOREIGN KEY ("assignedTeachingAssistantId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "group_discussion_score" DROP CONSTRAINT "FK_3982e593245f01e4d8f4155ef5b"`,
        );
        await queryRunner.query(
            `ALTER TABLE "group_discussion_score" DROP COLUMN "assignedTeachingAssistantId"`,
        );
    }
}
