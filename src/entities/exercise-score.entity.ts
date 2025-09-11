import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { User } from '@/entities/user.entity';
import { Cohort } from '@/entities/cohort.entity';
import { CohortWeek } from '@/entities/cohort-week.entity';
import { BaseEntity } from '@/entities/base.entity';
import { EXERCISE_MAX } from '@/common/constants';

@Entity()
export class ExerciseScore extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column('boolean', { default: false })
    isSubmitted!: boolean;

    @Column('boolean', { default: false })
    isPassing!: boolean;

    @Column('boolean', { default: false })
    hasGoodDocumentation!: boolean;

    @Column('boolean', { default: false })
    hasGoodStructure!: boolean;

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
     * - Good Documentation: 20 points if documentation is good
     * - Good Structure: 20 points if structure is good
     */
    get totalScore(): number {
        const submissionScore = this.isSubmitted ? EXERCISE_MAX.submission : 0;
        const testsScore = this.isPassing ? EXERCISE_MAX.tests : 0;
        const documentationScore = this.hasGoodDocumentation
            ? EXERCISE_MAX.documentation
            : 0;
        const structureScore = this.hasGoodStructure
            ? EXERCISE_MAX.structure
            : 0;

        return (
            submissionScore + testsScore + documentationScore + structureScore
        );
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
}
