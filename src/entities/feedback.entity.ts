import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    Unique,
} from 'typeorm';
import { User } from '@/entities/user.entity';
import { Cohort } from '@/entities/cohort.entity';
import { BaseEntity } from '@/entities/base.entity';
import { CohortComponent, ComponentRating } from '@/common/enum';

@Entity()
@Unique(['user', 'cohort'])
export class Feedback extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'jsonb', nullable: true })
    componentRatings!: Partial<Record<CohortComponent, ComponentRating>> | null;

    @Column({ type: 'text', nullable: true })
    expectations!: string | null;

    @Column({ type: 'text', nullable: true })
    improvements!: string | null;

    @Column({ type: 'jsonb', default: [] })
    opportunityInterests!: string[];

    @Column({ type: 'jsonb', default: [] })
    fellowshipInterests!: string[];

    @Column({ type: 'text', nullable: true })
    idealProject!: string | null;

    @Column({ type: 'text', nullable: true })
    testimonial!: string | null;

    @ManyToOne(() => User, { nullable: false })
    user!: User;

    @ManyToOne(() => Cohort, { nullable: false })
    cohort!: Cohort;
}
