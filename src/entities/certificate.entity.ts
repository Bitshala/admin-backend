import { BaseEntity } from '@/entities/base.entity';
import {
    Check,
    Column,
    Entity,
    ManyToOne,
    PrimaryGeneratedColumn,
    Unique,
} from 'typeorm';
import { CertificateType, TopPerformerRank } from '@/common/enum';
import { Cohort } from '@/entities/cohort.entity';
import { User } from '@/entities/user.entity';

@Entity()
@Unique(['cohort', 'user'])
@Check(`"type" != 'PERFORMER' OR "rank" IS NOT NULL`)
export class Certificate extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'enum', enum: CertificateType })
    type!: CertificateType;

    @Column('varchar')
    name!: string;

    @Column('boolean')
    withExercises!: boolean;

    @Column({ type: 'enum', enum: TopPerformerRank, nullable: true })
    rank!: TopPerformerRank | null;

    @ManyToOne(() => Cohort, (c) => c.certificates)
    cohort!: Cohort;

    @ManyToOne(() => User, (u) => u.certificates)
    user!: User;
}
