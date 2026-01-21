import {
    Column,
    DeleteDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseEntity } from '@/entities/base.entity';
import { Cohort } from '@/entities/cohort.entity';

@Entity()
export class Calendar extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    cohortId: string;

    @ManyToOne(() => Cohort)
    @JoinColumn({ name: 'cohortId' })
    cohort: Cohort;

    @Column()
    googleCalendarId: string;

    @Column({ nullable: true })
    summary?: string;

    @Column({ nullable: true })
    timezone?: string;

    @Column({ default: true })
    isActive: boolean;

    @DeleteDateColumn()
    deletedAt?: Date;
}
