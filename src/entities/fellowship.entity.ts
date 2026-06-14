import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToMany,
    OneToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseEntity } from '@/entities/base.entity';
import { FellowshipType, FellowshipStatus } from '@/common/enum';
import { User } from '@/entities/user.entity';
import { FellowshipApplication } from '@/entities/fellowship-application.entity';
import { FellowshipReport } from '@/entities/fellowship-report.entity';

@Entity()
export class Fellowship extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'enum', enum: FellowshipType })
    type!: FellowshipType;

    @Column({
        type: 'enum',
        enum: FellowshipStatus,
        default: FellowshipStatus.PENDING,
    })
    status!: FellowshipStatus;

    @Column('timestamptz', { nullable: true })
    startDate!: Date | null;

    @Column('timestamptz', { nullable: true })
    endDate!: Date | null;

    @Column('decimal', { nullable: true, precision: 10, scale: 2 })
    amountUsd!: string | null;

    @Column('text', { nullable: true })
    driveFolderUrl!: string | null;

    @ManyToOne(() => User)
    user!: User;

    @OneToOne(() => FellowshipApplication, (fa) => fa.fellowship)
    @JoinColumn()
    application!: FellowshipApplication;

    @OneToMany(() => FellowshipReport, (fr) => fr.fellowship)
    reports!: FellowshipReport[];
}
