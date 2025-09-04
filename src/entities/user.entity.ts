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

@Entity()
export class User extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column('text', { unique: true })
    email!: string;

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

    @ManyToMany(() => Cohort, (c) => c.users)
    cohorts!: Cohort[];

    @OneToMany(() => GroupDiscussionScore, (gds) => gds.user)
    groupDiscussionScores!: GroupDiscussionScore[];

    @OneToMany(() => ExerciseScore, (es) => es.user)
    exerciseScores!: ExerciseScore[];
}
