import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { User } from '@/entities/user.entity';
import { Cohort } from '@/entities/cohort.entity';
import { CohortWeek } from '@/entities/cohort-week.entity';
import { BaseEntity } from '@/entities/base.entity';
import { EXERCISE_MAX, SCALING_FACTOR } from '@/common/constants';

@Entity()
export class ExerciseScore extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column('boolean', { default: false })
    isSubmitted!: boolean;

    @Column('boolean', { default: false })
    isPassing!: boolean;

    @Column('text', { nullable: true })
    classroomRepositoryUrl!: string | null;

    @ManyToOne(() => User, (u) => u.exerciseScores)
    user!: User;

    @ManyToOne(() => Cohort, (c) => c.exerciseScores)
    cohort!: Cohort;

    @ManyToOne(() => CohortWeek, (cw) => cw.exerciseScores)
    cohortWeek!: CohortWeek;

    /**
     * Computes the participant's TOTAL score for this record.
     * Scoring Breakdown:
     * - Exercise Submission: 10 points if submitted
     * - Passing Tests: 50 points if all tests pass
     */
    get totalScore(): number {
        const submissionScore = this.isSubmitted ? EXERCISE_MAX.submission : 0;
        const testsScore = this.isPassing ? EXERCISE_MAX.tests : 0;

        return submissionScore + testsScore;
    }

    /**
     * Returns the maximum possible score for this entity.
     * This is a static value based on the defined scoring system.
     * Total Maximum Score: 100 points
     */
    get maxScore(): number {
        return Object.values(EXERCISE_MAX).reduce(
            (acc, score) => acc + score,
            0,
        );
    }

    /**
     * Computes the scaled score based on the total score and maximum score.
     * The scaled score is calculated to fit within the defined scaling factor for exercises.
     * Returns a rounded integer value.
     */
    get scaledScore(): number {
        return Math.round(
            (this.totalScore / this.maxScore) * SCALING_FACTOR.EXERCISE,
        );
    }

    /**
     * Returns the maximum possible scaled score for this entity.
     * This is a static value based on the defined scaling factor for exercises.
     */
    get maxScaledScore(): number {
        return SCALING_FACTOR.EXERCISE;
    }
}
