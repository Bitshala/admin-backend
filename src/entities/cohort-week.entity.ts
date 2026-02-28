import {
    Check,
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    OneToMany,
    Unique,
} from 'typeorm';
import { Cohort } from '@/entities/cohort.entity';
import { GroupDiscussionScore } from '@/entities/group-discussion-score.entity';
import { ExerciseScore } from '@/entities/exercise-score.entity';
import { Attendance } from '@/entities/attendance.entity';
import { BaseEntity } from '@/entities/base.entity';
import { CohortWeekType } from '@/common/enum';

@Entity()
@Unique(['cohort', 'week'])
@Check(`NOT "hasExercise" OR "type" = 'GROUP_DISCUSSION'`)
export class CohortWeek extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column('int')
    week!: number;

    @Column({ type: 'enum', enum: CohortWeekType })
    type!: CohortWeekType;

    @Column('boolean')
    hasExercise!: boolean;

    @Column('jsonb', { default: [] })
    questions!: string[];

    @Column('jsonb', { default: [] })
    bonusQuestion!: string[];

    @Column('text', { nullable: true })
    classroomInviteLink!: string | null;

    @Column('text', { nullable: true })
    classroomAssignmentUrl!: string | null;

    @Column('text', { nullable: true })
    classroomAssignmentId!: string | null;

    @ManyToOne(() => Cohort, (c) => c.weeks)
    cohort!: Cohort;

    @OneToMany(() => GroupDiscussionScore, (gds) => gds.cohortWeek)
    groupDiscussionScores!: GroupDiscussionScore[];

    @OneToMany(() => Attendance, (a) => a.cohortWeek)
    attendances!: Attendance[];

    @OneToMany(() => ExerciseScore, (es) => es.cohortWeek)
    exerciseScores!: ExerciseScore[];
}
