import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migrations1775229793448 implements MigrationInterface {
    name = 'Migrations1775229793448';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Migrate questions from string[] to {text, attachments}[]
        await queryRunner.query(`
            UPDATE cohort_week
            SET questions = (
                SELECT COALESCE(jsonb_agg(jsonb_build_object('text', elem.value #>> '{}', 'attachments', '[]'::jsonb)), '[]'::jsonb)
                FROM jsonb_array_elements(questions) AS elem(value)
            )
            WHERE jsonb_typeof(questions) = 'array'
              AND jsonb_array_length(questions) > 0
              AND jsonb_typeof(questions -> 0) = 'string'
        `);

        // Migrate bonusQuestion from string[] to {text, attachments}[]
        await queryRunner.query(`
            UPDATE cohort_week
            SET "bonusQuestion" = (
                SELECT COALESCE(jsonb_agg(jsonb_build_object('text', elem.value #>> '{}', 'attachments', '[]'::jsonb)), '[]'::jsonb)
                FROM jsonb_array_elements("bonusQuestion") AS elem(value)
            )
            WHERE jsonb_typeof("bonusQuestion") = 'array'
              AND jsonb_array_length("bonusQuestion") > 0
              AND jsonb_typeof("bonusQuestion" -> 0) = 'string'
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Revert questions from {text, attachments}[] back to string[]
        await queryRunner.query(`
            UPDATE cohort_week
            SET questions = (
                SELECT COALESCE(jsonb_agg(elem.value -> 'text'), '[]'::jsonb)
                FROM jsonb_array_elements(questions) AS elem(value)
            )
            WHERE jsonb_typeof(questions) = 'array'
              AND jsonb_array_length(questions) > 0
              AND jsonb_typeof(questions -> 0) = 'object'
        `);

        // Revert bonusQuestion from {text, attachments}[] back to string[]
        await queryRunner.query(`
            UPDATE cohort_week
            SET "bonusQuestion" = (
                SELECT COALESCE(jsonb_agg(elem.value -> 'text'), '[]'::jsonb)
                FROM jsonb_array_elements("bonusQuestion") AS elem(value)
            )
            WHERE jsonb_typeof("bonusQuestion") = 'array'
              AND jsonb_array_length("bonusQuestion") > 0
              AND jsonb_typeof("bonusQuestion" -> 0) = 'object'
        `);
    }
}
