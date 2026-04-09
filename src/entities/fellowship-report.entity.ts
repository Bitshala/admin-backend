import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from '@/entities/base.entity';
import { FellowshipReportStatus } from '@/common/enum';
import { User } from '@/entities/user.entity';
import { Fellowship } from '@/entities/fellowship.entity';

@Entity()
export class FellowshipReport extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column('int')
    month!: number;

    @Column('int')
    year!: number;

    @Column('text')
    content!: string;

    @Column({
        type: 'enum',
        enum: FellowshipReportStatus,
    })
    status!: FellowshipReportStatus;

    @Column('text', { nullable: true })
    reviewerRemarks!: string | null;

    @ManyToOne(() => Fellowship)
    fellowship!: Fellowship;

    @ManyToOne(() => User, { nullable: true })
    reviewedBy!: User | null;
}
