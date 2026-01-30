import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { User } from '@/entities/user.entity';
import { Cohort } from '@/entities/cohort.entity';
import { CohortWeek } from '@/entities/cohort-week.entity';
import { BaseEntity } from '@/entities/base.entity';
import { BONUS_MAX, GD_MAX, SCALING_FACTOR } from '@/common/constants';
import { calculateRatio } from '@/utils/math.utils';

@Entity()
export class GroupDiscussionScore extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column('boolean', { default: false })
    attendance!: boolean;

    @Column('int', { default: 0 })
    communicationScore!: number;

    @Column('int', { default: 5 })
    maxCommunicationScore!: number;

    @Column('int', { default: 0 })
    depthOfAnswerScore!: number;

    @Column('int', { default: 5 })
    maxDepthOfAnswerScore!: number;

    @Column('int', { default: 0 })
    technicalBitcoinFluencyScore!: number;

    @Column('int', { default: 5 })
    maxTechnicalBitcoinFluencyScore!: number;

    @Column('int', { default: 0 })
    engagementScore!: number;

    @Column('int', { default: 5 })
    maxEngagementScore!: number;

    @Column('boolean', { default: false })
    isBonusAttempted!: boolean;

    @Column('int', { default: 0 })
    bonusAnswerScore!: number;

    @Column('int', { default: 5 })
    maxBonusAnswerScore!: number;

    @Column('int', { default: 0 })
    bonusFollowupScore!: number;

    @Column('int', { default: 5 })
    maxBonusFollowupScore!: number;

    @Column('int', { nullable: true })
    groupNumber!: number | null;

    @ManyToOne(() => User, (u) => u.groupDiscussionScores)
    user!: User;

    @ManyToOne(() => Cohort, (c) => c.groupDiscussionScores)
    cohort!: Cohort;

    @ManyToOne(() => CohortWeek, (cw) => cw.groupDiscussionScores)
    cohortWeek!: CohortWeek;

    @ManyToOne(() => User, (u) => u.assignedGroupDiscussionScores)
    assignedTeachingAssistant!: User;

    /**
     * Computes the participant's TOTAL score for this record.
     * Scoring Breakdown:
     * - GD Round uses: points = MaxPointsPerTrait * (grade / maxGrade)
     *   Max points per trait: Communication 30, Depth 30, Technical 20, Engagement 20
     * - Bonus Round (per question):
     *   Attempted +10, Elaborate +30 (scaled by grade/maxGrade), Follow-up +10 (scaled by grade/maxGrade)
     */
    get totalScore(): number {
        const gdCommunication =
            GD_MAX.communication *
            calculateRatio(this.communicationScore, this.maxCommunicationScore);
        const gdDepth =
            GD_MAX.depth *
            calculateRatio(this.depthOfAnswerScore, this.maxDepthOfAnswerScore);
        const gdTechnical =
            GD_MAX.technical *
            calculateRatio(
                this.technicalBitcoinFluencyScore,
                this.maxTechnicalBitcoinFluencyScore,
            );
        const gdEngagement =
            GD_MAX.engagement *
            calculateRatio(this.engagementScore, this.maxEngagementScore);

        const gdTotal = gdCommunication + gdDepth + gdTechnical + gdEngagement; // max 100

        const bonusAttempt = this.isBonusAttempted ? BONUS_MAX.attempt : 0;
        const bonusAnswer =
            BONUS_MAX.answer *
            calculateRatio(this.bonusAnswerScore, this.maxBonusAnswerScore);
        const bonusFollowup =
            BONUS_MAX.followup *
            calculateRatio(this.bonusFollowupScore, this.maxBonusFollowupScore);

        const bonusTotal = bonusAttempt + bonusAnswer + bonusFollowup; // max 50

        return gdTotal + bonusTotal;
    }

    /**
     * Returns the maximum possible score for this entity.
     * This is a static value based on the defined scoring system.
     * - GD Round max: 100 points
     * - Bonus Round max: 50 points
     * Total max score: 150 points
     */
    get maxScore(): number {
        return (
            Object.values(GD_MAX).reduce((acc, score) => acc + score, 0) +
            Object.values(BONUS_MAX).reduce((acc, score) => acc + score, 0)
        );
    }

    /**
     * Computes the scaled score based on the total score and maximum score.
     * The scaled score is calculated to fit within the defined scaling factor for group discussions.
     * Returns a rounded integer value.
     */
    get scaledScore(): number {
        return Math.round(
            (this.totalScore / this.maxScore) * SCALING_FACTOR.GD,
        );
    }

    /**
     * Returns the maximum possible scaled score for this entity.
     * This is a static value based on the defined scaling factor for group discussions.
     */
    get maxScaledScore(): number {
        return SCALING_FACTOR.GD;
    }

    /**
     * Computes the scaled attendance score.
     * If the participant attended, they receive the full attendance scaling factor; otherwise, they receive zero.
     * Returns the attendance score.
     */
    get scaledAttendanceScore(): number {
        return this.attendance ? SCALING_FACTOR.ATTENDANCE : 0;
    }

    /**
     * Returns the maximum possible scaled attendance score for this entity.
     * This is a static value based on the defined scaling factor for attendance.
     */
    get maxScaledAttendanceScore(): number {
        return SCALING_FACTOR.ATTENDANCE;
    }
}
