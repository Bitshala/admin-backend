import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { User } from '@/entities/user.entity';
import { Cohort } from '@/entities/cohort.entity';
import { CohortWeek } from '@/entities/cohort-week.entity';
import { BaseEntity } from '@/entities/base.entity';

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
    isBonusAttempted!: number;

    @Column('int', { default: 0 })
    bonusAnswerScore!: number;

    @Column('int', { default: 5 })
    maxBonusAnswerScore!: number;

    @Column('int', { default: 0 })
    bonusFollowupScore!: number;

    @Column('int', { default: 5 })
    maxBonusFollowupScore!: number;

    @ManyToOne(() => User, (u) => u.groupDiscussionScores)
    user!: User;

    @ManyToOne(() => Cohort, (c) => c.groupDiscussionScores)
    cohort!: Cohort;

    @ManyToOne(() => CohortWeek, (cw) => cw.groupDiscussionScores)
    cohortWeek!: CohortWeek;
}
