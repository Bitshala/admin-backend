import {
    Column,
    Entity,
    ManyToOne,
    OneToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseEntity } from '@/entities/base.entity';
import {
    FellowshipType,
    FellowshipApplicationStatus,
    EducationCategory,
    CohortType,
} from '@/common/enum';
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

    // Education (EDUCATOR) track fields. Populated only for education
    // applications; null for the developer/designer tracks.
    @Column({ type: 'enum', enum: EducationCategory, nullable: true })
    educationCategory!: EducationCategory | null;

    // The course the applicant wants to TA, when educationCategory is COHORT_TA.
    @Column({ type: 'enum', enum: CohortType, nullable: true })
    cohortType!: CohortType | null;

    // The city where a meetup will be held, when educationCategory is MEETUP.
    @Column('text', { nullable: true })
    city!: string | null;

    // Free-form description of the activity, when educationCategory is OTHER.
    @Column('text', { nullable: true })
    educationCategoryOther!: string | null;

    // Monthly scope-of-work breakdown for the education activity.
    @Column('text', { nullable: true })
    scopeOfWork!: string | null;

    @Column({
        type: 'enum',
        enum: FellowshipApplicationStatus,
    })
    status!: FellowshipApplicationStatus;

    @Column('text', { nullable: true })
    reviewerRemarks!: string | null;

    // Drive folder that holds this application's fellowship documents. Created
    // lazily on accept. An internal detail — never exposed across an API boundary.
    @Column('text', { nullable: true })
    driveFolderId!: string | null;

    @ManyToOne(() => User)
    applicant!: User;

    @ManyToOne(() => User, { nullable: true })
    reviewedBy!: User | null;

    @OneToOne(() => Fellowship, (f) => f.application, { nullable: true })
    fellowship!: Fellowship | null;
}
