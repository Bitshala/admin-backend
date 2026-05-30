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

export interface Question {
    text: string;
    attachments: string[];
}

export interface ReadingMaterial {
    label: string;
    url: string;
}

export interface Exercise {
    title: string;
    concepts: string;
    problem: string;
    expectedOutput: string[];
}

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
    questions!: Question[];

    @Column('jsonb', { default: [] })
    bonusQuestion!: Question[];

    @Column('text', { nullable: true })
    title!: string | null;

    @Column('jsonb', { default: [] })
    readingMaterial!: ReadingMaterial[];

    @Column('text', { nullable: true })
    activity!: string | null;

    @Column('jsonb', { nullable: true })
    exercise!: Exercise | null;

    @Column('text', { nullable: true })
    classroomInviteLink!: string | null;

    @Column('text', { nullable: true })
    classroomAssignmentUrl!: string | null;

    @Column('text', { nullable: true })
    classroomAssignmentId!: string | null;

    @Column({ type: 'timestamp with time zone' })
    scheduledDate!: Date;

    @ManyToOne(() => Cohort, (c) => c.weeks)
    cohort!: Cohort;

    @OneToMany(() => GroupDiscussionScore, (gds) => gds.cohortWeek)
    groupDiscussionScores!: GroupDiscussionScore[];

    @OneToMany(() => Attendance, (a) => a.cohortWeek)
    attendances!: Attendance[];

    @OneToMany(() => ExerciseScore, (es) => es.cohortWeek)
    exerciseScores!: ExerciseScore[];
}
