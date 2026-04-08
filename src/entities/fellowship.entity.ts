import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseEntity } from '@/entities/base.entity';
import { FellowshipType, FellowshipStatus } from '@/common/enum';
import { User } from '@/entities/user.entity';
import { FellowshipApplication } from '@/entities/fellowship-application.entity';

@Entity()
export class Fellowship extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'enum', enum: FellowshipType })
    type!: FellowshipType;

    @Column({
        type: 'enum',
        enum: FellowshipStatus,
        default: FellowshipStatus.PENDING,
    })
    status!: FellowshipStatus;

    @Column('timestamptz', { nullable: true })
    startDate!: Date | null;

    @Column('timestamptz', { nullable: true })
    endDate!: Date | null;

    @Column('decimal', { nullable: true, precision: 10, scale: 2 })
    amountUsd!: string | null;

    @Column('text', { nullable: true })
    mentorContact!: string | null;

    @Column('text', { nullable: true })
    projectName!: string | null;

    @Column('text', { nullable: true })
    projectGithubLink!: string | null;

    @Column('text', { nullable: true })
    githubProfile!: string | null;

    @Column('text', { nullable: true })
    location!: string | null;

    @Column('text', { nullable: true })
    academicBackground!: string | null;

    @Column('int', { nullable: true })
    graduationYear!: number | null;

    @Column('text', { nullable: true })
    professionalExperience!: string | null;

    @Column({ type: 'jsonb', nullable: true })
    domains!: string[] | null;

    @Column({ type: 'jsonb', nullable: true })
    codingLanguages!: string[] | null;

    @Column({ type: 'jsonb', nullable: true })
    educationInterests!: string[] | null;

    @Column('text', { nullable: true })
    bitcoinContributions!: string | null;

    @Column('text', { nullable: true })
    bitcoinMotivation!: string | null;

    @Column('text', { nullable: true })
    bitcoinOssGoal!: string | null;

    @Column('text', { nullable: true })
    additionalInfo!: string | null;

    @Column('text', { nullable: true })
    questionsForBitshala!: string | null;

    @ManyToOne(() => User)
    user!: User;

    @OneToOne(() => FellowshipApplication, (fa) => fa.fellowship)
    @JoinColumn()
    application!: FellowshipApplication;
}
