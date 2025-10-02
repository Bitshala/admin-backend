import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from '@/entities/base.entity';
import { CohortType } from '@/common/enum';
import { User } from '@/entities/user.entity';

@Entity()
export class CohortWaitlist extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'enum', enum: CohortType })
    type!: CohortType;

    @ManyToOne(() => User, (u) => u.cohortsWaitlist)
    user!: User;
}
