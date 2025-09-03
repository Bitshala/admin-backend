import {
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
import { BaseEntity } from '@/entities/base.entity';

@Entity()
@Unique(['cohort', 'week'])
export class CohortWeek extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column('int')
    week!: number;

    @Column('jsonb', { default: [] })
    questions!: string[];

    @Column('jsonb', { default: [] })
    bonusQuestion!: string[];

    @Column('text', { nullable: true })
    classroomUrl!: string | null;

    @Column('text', { nullable: true })
    classroomInviteLink!: string | null;

    @ManyToOne(() => Cohort, (c) => c.weeks)
    cohort!: Cohort;

    @OneToMany(() => GroupDiscussionScore, (gds) => gds.cohortWeek)
    groupDiscussionScores!: GroupDiscussionScore[];

    @OneToMany(() => ExerciseScore, (es) => es.cohortWeek)
    exerciseScores!: ExerciseScore[];
}
