import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { User } from '@/entities/user.entity';
import { Cohort } from '@/entities/cohort.entity';
import { CohortWeek } from '@/entities/cohort-week.entity';
import { BaseEntity } from '@/entities/base.entity';

@Entity()
export class ExerciseScore extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column('boolean', { default: false })
    isSubmitted!: boolean;

    @Column('boolean', { default: false })
    isPassing!: boolean;

    @Column('boolean', { default: false })
    hasGoodDocumentation!: boolean;

    @Column('boolean', { default: false })
    hasGoodStructure!: boolean;

    @ManyToOne(() => User, (u) => u.exerciseScores)
    user!: User;

    @ManyToOne(() => Cohort, (c) => c.exerciseScores)
    cohort!: Cohort;

    @ManyToOne(() => CohortWeek, (cw) => cw.exerciseScores)
    cohortWeek!: CohortWeek;
}
