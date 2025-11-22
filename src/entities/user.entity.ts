import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    OneToMany,
    ManyToMany,
} from 'typeorm';
import { Cohort } from '@/entities/cohort.entity';
import { GroupDiscussionScore } from '@/entities/group-discussion-score.entity';
import { ExerciseScore } from '@/entities/exercise-score.entity';
import { BaseEntity } from '@/entities/base.entity';
import { UserRole } from '@/common/enum';
import { CohortWaitlist } from '@/entities/cohort-waitlist.entity';

@Entity()
export class User extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column('text', { unique: true, nullable: true })
    email!: string | null;

    @Column('text', { unique: true })
    discordUserId!: string;

    @Column('text')
    discordUserName!: string;

    @Column('text', { nullable: true })
    discordGlobalName!: string | null;

    @Column('boolean', { default: false })
    isGuildMember!: boolean;

    @Column('varchar', { nullable: true })
    name!: string | null;

    @Column({ type: 'enum', enum: UserRole })
    role!: UserRole;

    @Column('varchar', { nullable: true })
    description!: string | null;

    @Column('text', { nullable: true })
    background!: string | null;

    @Column('varchar', { length: 2048, nullable: true })
    githubProfileUrl!: string | null;

    @Column({ type: 'jsonb', default: [] })
    skills!: string[];

    @Column({ type: 'date', nullable: true })
    firstHeardAboutBitcoinOn!: string | null;

    @Column({ type: 'jsonb', default: [] })
    bitcoinBooksRead!: string[];

    @Column('text', { nullable: true })
    whyBitcoin!: string | null;

    @Column('int', { nullable: true })
    weeklyCohortCommitmentHours!: number | null;

    @Column('varchar', { length: 255, nullable: true })
    location!: string | null;

    @Column('varchar', { length: 255, nullable: true })
    referral!: string | null;

    @ManyToMany(() => Cohort, (c) => c.users)
    cohorts!: Cohort[];

    @OneToMany(() => GroupDiscussionScore, (gds) => gds.user)
    groupDiscussionScores!: GroupDiscussionScore[];

    @OneToMany(() => ExerciseScore, (es) => es.user)
    exerciseScores!: ExerciseScore[];

    @OneToMany(() => CohortWaitlist, (cwl) => cwl.user)
    cohortsWaitlist!: CohortWaitlist[];
}
