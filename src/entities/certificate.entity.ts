import { BaseEntity } from '@/entities/base.entity';
import {
    Column,
    Entity,
    ManyToOne,
    PrimaryGeneratedColumn,
    Unique,
} from 'typeorm';
import { CertificateType } from '@/common/enum';
import { Cohort } from '@/entities/cohort.entity';
import { User } from '@/entities/user.entity';

@Entity()
@Unique(['cohort', 'user'])
export class Certificate extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'enum', enum: CertificateType })
    type!: CertificateType;

    @Column('varchar')
    name!: string;

    @ManyToOne(() => Cohort, (c) => c.certificates)
    cohort!: Cohort;

    @ManyToOne(() => User, (u) => u.certificates)
    user!: User;
}
