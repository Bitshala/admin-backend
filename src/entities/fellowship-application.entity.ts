import {
    Column,
    Entity,
    ManyToOne,
    OneToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseEntity } from '@/entities/base.entity';
import { FellowshipType, FellowshipApplicationStatus } from '@/common/enum';
import { User } from '@/entities/user.entity';
import { Fellowship } from '@/entities/fellowship.entity';

@Entity()
export class FellowshipApplication extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'enum', enum: FellowshipType })
    type!: FellowshipType;

    @Column('text', { nullable: true })
    title!: string | null;

    @Column('text', { nullable: true })
    problemStatement!: string | null;

    @Column('text', { nullable: true })
    plan!: string | null;

    @Column('text', { nullable: true })
    mentorName!: string | null;

    @Column('text', { nullable: true })
    mentorContact!: string | null;

    @Column('text', { nullable: true })
    mentorTestimonial!: string | null;

    // Stored as a bare github username (e.g. `aarav-m`).
    @Column('text', { nullable: true })
    github!: string | null;

    @Column('text', { array: true, default: () => "'{}'" })
    links!: string[];

    @Column('text', { nullable: true })
    projectName!: string | null;

    @Column('text', { nullable: true })
    projectGithubLink!: string | null;

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

    @Column({
        type: 'enum',
        enum: FellowshipApplicationStatus,
    })
    status!: FellowshipApplicationStatus;

    @Column('text', { nullable: true })
    reviewerRemarks!: string | null;

    @ManyToOne(() => User)
    applicant!: User;

    @ManyToOne(() => User, { nullable: true })
    reviewedBy!: User | null;

    @OneToOne(() => Fellowship, (f) => f.application, { nullable: true })
    fellowship!: Fellowship | null;
}
