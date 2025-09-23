import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migrations1758614524385 implements MigrationInterface {
    name = 'Migrations1758614524385';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "group_discussion_score" ADD "groupNumber" integer`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "group_discussion_score" DROP COLUMN "groupNumber"`,
        );
    }
}
