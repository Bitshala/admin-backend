import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { User } from '@/entities/user.entity';
import { Cohort } from '@/entities/cohort.entity';
import { BaseEntity } from '@/entities/base.entity';

@Entity()
export class Feedback extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column('text')
    preferredName!: string;

    @Column('text')
    email!: string;

    @Column('text')
    feedbackText!: string;

    @ManyToOne(() => User, { nullable: false })
    user!: User;

    @ManyToOne(() => Cohort, { nullable: false })
    cohort!: Cohort;
}
