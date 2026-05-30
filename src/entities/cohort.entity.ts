import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    OneToMany,
    Unique,
} from 'typeorm';
import { CohortWeek } from '@/entities/cohort-week.entity';
import { GroupDiscussionScore } from '@/entities/group-discussion-score.entity';
import { ExerciseScore } from '@/entities/exercise-score.entity';
import { Attendance } from '@/entities/attendance.entity';
import { BaseEntity } from '@/entities/base.entity';
import { CohortType, UserRole } from '@/common/enum';
import { Certificate } from '@/entities/certificate.entity';
import { CohortMembership } from '@/entities/cohort-membership.entity';
import { ServiceError } from '@/common/errors';

export interface Link {
    label: string;
    url: string;
    // Minimum role required to see this link. Absent => visible to everyone.
    minRole?: UserRole;
}

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

    @Column('boolean')
    hasExercises!: boolean;

    @Column('text', { nullable: true })
    classroomId!: string | null;

    // Instruction-sheet links (global + course-specific). Seeded from config at
    // creation, editable per cohort. minRole gates visibility (filtered at read).
    @Column('jsonb', { default: [] })
    links!: Link[];

    getEndDate(): Date {
        if (this.weeks === undefined || this.weeks === null) {
            throw new ServiceError(
                'Cohort weeks not loaded. Ensure that the cohort entity is loaded with its weeks relation.',
            );
        }

        return this.weeks.reduce(
            (max, week) =>
                week.scheduledDate > max ? week.scheduledDate : max,
            this.weeks[0].scheduledDate,
        );
    }

    @OneToMany(() => CohortMembership, (m) => m.cohort)
    memberships!: CohortMembership[];

    @OneToMany(() => CohortWeek, (cw) => cw.cohort)
    weeks!: CohortWeek[];

    @OneToMany(() => GroupDiscussionScore, (gds) => gds.cohort)
    groupDiscussionScores!: GroupDiscussionScore[];

    @OneToMany(() => Attendance, (a) => a.cohort)
    attendances!: Attendance[];

    @OneToMany(() => ExerciseScore, (es) => es.cohort)
    exerciseScores!: ExerciseScore[];

    @OneToMany(() => Certificate, (c) => c.cohort)
    certificates!: Certificate[];
}
