import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    OneToMany,
    ManyToMany,
    Unique,
} from 'typeorm';
import { User } from '@/entities/user.entity';
import { CohortWeek } from '@/entities/cohort-week.entity';
import { GroupDiscussionScore } from '@/entities/group-discussion-score.entity';
import { ExerciseScore } from '@/entities/exercise-score.entity';
import { BaseEntity } from '@/entities/base.entity';
import { CohortType } from '@/common/enum';

@Entity()
@Unique(['type', 'season'])
export class Cohort extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'enum', enum: CohortType })
    type!: CohortType;

    @Column('int')
    season!: number;

    @Column('timestamptz')
    registrationDeadline!: Date;

    @Column('timestamptz')
    startDate!: Date;

    @Column('timestamptz')
    endDate!: Date;

    @ManyToMany(() => User, (u) => u.cohorts)
    users!: User[];

    @OneToMany(() => CohortWeek, (cw) => cw.cohort)
    weeks!: CohortWeek[];

    @OneToMany(() => GroupDiscussionScore, (gds) => gds.cohort)
    groupDiscussionScores!: GroupDiscussionScore[];

    @OneToMany(() => ExerciseScore, (es) => es.cohort)
    exerciseScores!: ExerciseScore[];
}
