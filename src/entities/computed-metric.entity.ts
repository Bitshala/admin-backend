import { Column, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { BaseEntity } from '@/entities/base.entity';
import { MetricType } from '@/metrics/metric.enums';
import { MetricData } from '@/metrics/metric.types';

// Generic, strongly-typed store for precomputed metrics — mirrors the
// APITask<T> payload pattern (a `type` discriminator + a versioned `jsonb`
// `data` typed via MetricDataMap). One current row per metric type, overwritten
// each run (no history). Intentionally decoupled from any domain table (no FK).
@Entity()
@Unique(['type'])
export class ComputedMetric<T extends MetricType> extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({
        type: 'varchar',
        length: 50,
        nullable: false,
    })
    type!: T;

    @Column({
        type: 'integer',
        default: 1,
    })
    version!: number;

    @Column('jsonb')
    data!: MetricData<T>;
}
