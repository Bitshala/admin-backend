import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migrations1778000000000 implements MigrationInterface {
    name = 'Migrations1778000000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Pick up to 50 random STUDENT users as fellowship applicants.
        // Each row carries pre-generated UUIDs so apps/fellowships/reports
        // can reference each other without RETURNING round-trips.
        await queryRunner.query(`
            CREATE TEMP TABLE seed_apps ON COMMIT DROP AS
            SELECT
                uuid_generate_v4() AS app_id,
                uuid_generate_v4() AS fellowship_id,
                u.id AS applicant_id,
                ROW_NUMBER() OVER (ORDER BY RANDOM()) AS rn
            FROM "user" u
            WHERE u.role = 'STUDENT'
            LIMIT 50
        `);

        // Only ADMINs are allowed to review fellowship applications/reports.
        await queryRunner.query(`
            CREATE TEMP TABLE seed_reviewers ON COMMIT DROP AS
            SELECT
                u.id,
                ROW_NUMBER() OVER (ORDER BY RANDOM()) AS rn
            FROM "user" u
            WHERE u.role = 'ADMIN'
        `);

        // Insert ~50 fellowship applications spanning all four statuses.
        // Status distribution by rn:
        //   1..7   -> DRAFT      (7)
        //   8..14  -> SUBMITTED  (7)
        //   15..44 -> ACCEPTED   (30, each gets a fellowship)
        //   45..50 -> REJECTED   (6)
        await queryRunner.query(`
            INSERT INTO fellowship_application (
                "id", "type", "title", "problemStatement", "plan",
                "mentorName", "mentorContact", "mentorTestimonial",
                "github", "links",
                "projectName", "projectGithubLink", "academicBackground",
                "graduationYear", "professionalExperience", "domains",
                "codingLanguages", "educationInterests", "bitcoinContributions",
                "bitcoinMotivation", "bitcoinOssGoal", "additionalInfo",
                "questionsForBitshala",
                "status", "reviewerRemarks",
                "applicantId", "reviewedById", "createdAt", "updatedAt"
            )
            SELECT
                sa.app_id,
                ((ARRAY['DEVELOPER','DESIGNER','EDUCATOR'])[1 + ((sa.rn - 1) % 3)])::"public"."fellowship_application_type_enum",
                E'Fellowship proposal #' || sa.rn,
                E'Problem statement #' || sa.rn || E': a meaningful gap in the Bitcoin ecosystem that this fellowship aims to close, and why it matters.',
                E'6-month plan #' || sa.rn || E':\n- Month 1-2: Deliverable A\n- Month 3-4: Deliverable B\n- Month 5-6: Deliverable C',
                'Mentor ' || sa.rn,
                'mentor' || sa.rn || '@example.com',
                CASE WHEN sa.rn % 2 = 0 THEN 'Strong candidate, happy to mentor application #' || sa.rn ELSE NULL END,
                'dummy-user-' || sa.rn,
                ARRAY['https://github.com/dummy-user-' || sa.rn, 'https://example.com/portfolio/' || sa.rn]::text[],
                'Dummy Project ' || sa.rn,
                'https://github.com/dummy-org/project-' || sa.rn,
                'B.Tech, Computer Science',
                2015 + ((sa.rn - 1) % 9),
                (3 + ((sa.rn - 1) % 5)) || ' years building backend systems and contributing to OSS.',
                '["scaling","privacy","wallets"]'::jsonb,
                '["Rust","TypeScript","Python"]'::jsonb,
                '["education","mentoring","content"]'::jsonb,
                'Contributed to bitcoin-core PR #' || (1000 + sa.rn) || ' and reviewed several others.',
                'I want to deepen my understanding of the Bitcoin protocol and contribute to OSS full-time.',
                'Build OSS tooling that lowers the bar for new Bitcoin developers.',
                'Available full-time for the duration of the fellowship.',
                'Looking forward to collaborating with the Bitshala community.',
                (CASE
                    WHEN sa.rn <= 7 THEN 'DRAFT'
                    WHEN sa.rn <= 14 THEN 'SUBMITTED'
                    WHEN sa.rn <= 44 THEN 'ACCEPTED'
                    ELSE 'REJECTED'
                END)::"public"."fellowship_application_status_enum",
                CASE
                    WHEN sa.rn > 14 THEN 'Dummy reviewer remarks for application #' || sa.rn
                    ELSE NULL
                END,
                sa.applicant_id,
                CASE
                    WHEN sa.rn > 14 THEN (
                        SELECT id FROM seed_reviewers
                        WHERE rn = 1 + (sa.rn % NULLIF((SELECT COUNT(*)::int FROM seed_reviewers), 0))
                    )
                    ELSE NULL
                END,
                NOW() - (sa.rn * INTERVAL '7 days'),
                NOW() - (sa.rn * INTERVAL '7 days')
            FROM seed_apps sa
        `);

        // Insert ~30 fellowships, one per ACCEPTED application.
        // Status by sub-index (sa.rn - 14):
        //   1..5   -> PENDING   (5)
        //   6..25  -> ACTIVE    (20)
        //   26..30 -> COMPLETED (5)
        await queryRunner.query(`
            INSERT INTO fellowship (
                "id", "type", "status",
                "startDate", "endDate", "amountUsd",
                "userId", "applicationId",
                "createdAt", "updatedAt"
            )
            SELECT
                sa.fellowship_id,
                ((ARRAY['DEVELOPER','DESIGNER','EDUCATOR'])[1 + ((sa.rn - 1) % 3)])::"public"."fellowship_type_enum",
                (CASE
                    WHEN (sa.rn - 14) <= 5 THEN 'PENDING'
                    WHEN (sa.rn - 14) <= 25 THEN 'ACTIVE'
                    ELSE 'COMPLETED'
                END)::"public"."fellowship_status_enum",
                CASE
                    WHEN (sa.rn - 14) <= 5 THEN NULL
                    ELSE NOW() - ((sa.rn - 14) * INTERVAL '15 days')
                END,
                CASE
                    WHEN (sa.rn - 14) <= 5 THEN NULL
                    WHEN (sa.rn - 14) <= 25 THEN NOW() + INTERVAL '180 days'
                    ELSE NOW() - INTERVAL '15 days'
                END,
                (1500 + ((sa.rn - 14) * 75))::numeric(10,2),
                sa.applicant_id,
                sa.app_id,
                NOW() - (sa.rn * INTERVAL '7 days'),
                NOW() - (sa.rn * INTERVAL '7 days')
            FROM seed_apps sa
            WHERE sa.rn BETWEEN 15 AND 44
        `);

        // Insert ~150 fellowship reports.
        // Per-fellowship report counts by status:
        //   PENDING   -> 0  (generate_series(1, 0) returns no rows)
        //   ACTIVE    -> 5  (20 fellowships * 5 = 100)
        //   COMPLETED -> 10 (5 fellowships * 10 = 50)
        // Report status cycles DRAFT/SUBMITTED/APPROVED/REJECTED by (rn + idx) % 4.
        await queryRunner.query(`
            INSERT INTO fellowship_report (
                "id", "month", "year", "summary", "links",
                "challengingWork", "keyLearning", "reviewerFeedback", "growthGoal",
                "status",
                "reviewerRemarks", "fellowshipId", "reviewedById",
                "createdAt", "updatedAt"
            )
            SELECT
                uuid_generate_v4(),
                EXTRACT(MONTH FROM (NOW() - (gs.idx * INTERVAL '1 month')))::int,
                EXTRACT(YEAR FROM (NOW() - (gs.idx * INTERVAL '1 month')))::int,
                E'## Monthly report #' || gs.idx || E' for fellowship ' || sa.rn || E'\n\n### Progress\n- Shipped feature X\n- Reviewed N PRs\n- Wrote 2 blog posts\n\n### Blockers\n- None this month',
                ARRAY[
                    'https://github.com/dummy-org/project-' || sa.rn || '/pull/' || gs.idx,
                    'https://github.com/dummy-org/project-' || sa.rn || '/issues/' || gs.idx
                ]::text[],
                E'The trickiest work this month was task #' || gs.idx || E'. I first tried approach A, then switched to approach B once I understood the constraints.',
                E'I now understand part X of the codebase and tool Y far better than I did at the start of the month.',
                E'A maintainer suggested I split large PRs into smaller, reviewable chunks.',
                E'Next month I want to get better at writing tests and reading unfamiliar code faster.',
                (CASE ((sa.rn + gs.idx) % 4)
                    WHEN 0 THEN 'DRAFT'
                    WHEN 1 THEN 'SUBMITTED'
                    WHEN 2 THEN 'APPROVED'
                    ELSE 'REJECTED'
                END)::"public"."fellowship_report_status_enum",
                CASE
                    WHEN ((sa.rn + gs.idx) % 4) IN (2, 3)
                        THEN 'Dummy review remarks for report ' || gs.idx || ' of fellowship #' || sa.rn
                    ELSE NULL
                END,
                sa.fellowship_id,
                CASE
                    WHEN ((sa.rn + gs.idx) % 4) IN (2, 3) THEN (
                        SELECT id FROM seed_reviewers
                        WHERE rn = 1 + ((sa.rn + gs.idx) % NULLIF((SELECT COUNT(*)::int FROM seed_reviewers), 0))
                    )
                    ELSE NULL
                END,
                NOW() - (gs.idx * INTERVAL '30 days'),
                NOW() - (gs.idx * INTERVAL '30 days')
            FROM seed_apps sa
            CROSS JOIN LATERAL (
                SELECT generate_series(1,
                    CASE
                        WHEN (sa.rn - 14) <= 5 THEN 0
                        WHEN (sa.rn - 14) <= 25 THEN 5
                        ELSE 10
                    END
                ) AS idx
            ) gs
            WHERE sa.rn BETWEEN 15 AND 44
        `);

        await queryRunner.query(`DROP TABLE IF EXISTS seed_apps`);
        await queryRunner.query(`DROP TABLE IF EXISTS seed_reviewers`);
    }

    public async down(): Promise<void> {
        // No-op: seed data is left in place. Drop the local DB and re-snapshot
        // if you need a clean slate.
    }
}
