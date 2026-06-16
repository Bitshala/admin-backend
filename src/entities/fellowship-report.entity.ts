import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from '@/entities/base.entity';
import { FellowshipReportStatus } from '@/common/enum';
import { User } from '@/entities/user.entity';
import { Fellowship } from '@/entities/fellowship.entity';

@Entity()
export class FellowshipReport extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column('int')
    month!: number;

    @Column('int')
    year!: number;

    @Column('text', { default: '' })
    summary!: string;

    // Ordered list of GitHub PR/issue URLs backing the report.
    @Column('text', { array: true, default: () => "'{}'" })
    links!: string[];

    // Reflective prompts. All optional — stored and surfaced but never gate
    // submission. Q1: the month's most challenging/interesting piece of work.
    @Column('text', { default: '' })
    challengingWork!: string;

    // Q2: something newly understood this month.
    @Column('text', { default: '' })
    keyLearning!: string;

    // Q3: a piece of feedback from a maintainer or reviewer.
    @Column('text', { default: '' })
    reviewerFeedback!: string;

    // Q4: what the fellow wants to get better at next month.
    @Column('text', { default: '' })
    growthGoal!: string;

    @Column({
        type: 'enum',
        enum: FellowshipReportStatus,
    })
    status!: FellowshipReportStatus;

    @Column('text', { nullable: true })
    reviewerRemarks!: string | null;

    @ManyToOne(() => Fellowship)
    fellowship!: Fellowship;

    @ManyToOne(() => User, { nullable: true })
    reviewedBy!: User | null;
}
