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

@Entity()
@Unique(['user', 'cohort'])
export class CohortMembership extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @ManyToOne(() => User, (u) => u.cohortMemberships)
    user!: User;

    @ManyToOne(() => Cohort, (c) => c.memberships, { onDelete: 'CASCADE' })
    cohort!: Cohort;

    @Column('boolean', { default: false })
    discordRoleAssigned!: boolean;

    @Column('boolean', { default: false })
    alumniRoleAssigned!: boolean;
}
