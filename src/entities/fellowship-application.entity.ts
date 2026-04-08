import {
    Column,
    Entity,
    ManyToOne,
    OneToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseEntity } from '@/entities/base.entity';
import { FellowshipType, FellowshipApplicationStatus } from '@/common/enum';
import { User } from '@/entities/user.entity';
import { Fellowship } from '@/entities/fellowship.entity';

@Entity()
export class FellowshipApplication extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'enum', enum: FellowshipType })
    type!: FellowshipType;

    @Column('text')
    proposal!: string;

    @Column({
        type: 'enum',
        enum: FellowshipApplicationStatus,
    })
    status!: FellowshipApplicationStatus;

    @Column('text', { nullable: true })
    reviewerRemarks!: string | null;

    @ManyToOne(() => User)
    applicant!: User;

    @ManyToOne(() => User, { nullable: true })
    reviewedBy!: User | null;

    @OneToOne(() => Fellowship, (f) => f.application, { nullable: true })
    fellowship!: Fellowship | null;
}
