import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from '@/entities/base.entity';
import { APITaskStatus, TaskType } from '@/task-processor/task.enums';
import { TaskData } from '@/task-processor/task.types';

@Entity()
export class APITask<T extends TaskType> extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({
        type: 'varchar',
        length: 50,
        nullable: false,
    })
    type: T;

    @Column({
        type: 'enum',
        enum: APITaskStatus,
        default: APITaskStatus.UNPROCESSED,
        nullable: false,
    })
    status: APITaskStatus;

    @Column('jsonb')
    data: TaskData<T>;

    @Column({
        type: 'timestamp with time zone',
        nullable: true,
    })
    processStartTime: Date;

    @Column({
        type: 'integer',
        default: 0,
    })
    retryCount: number;

    @Column({
        type: 'integer',
        default: 3,
    })
    retryLimit: number;

    @Column({ type: 'text', nullable: true })
    lastExecutionFailureDetails: string;

    @Column({ type: 'timestamp with time zone', nullable: true })
    lastRetryTime: Date;

    @Column({
        type: 'timestamp with time zone',
        default: () => 'now()',
    })
    executeOnTime: Date;
}
