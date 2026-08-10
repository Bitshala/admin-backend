import { MetricType } from '@/metrics/metric.enums';
import { CohortType } from '@/common/enum';

// Bump when CohortMetricsData's shape changes so a stale precomputed payload
// can be detected/ignored after a deploy.
export const COHORT_METRICS_VERSION = 1;

// Per-cohort metrics as persisted in the versioned payload. Deliberately
// duplicated from CohortMetricsDto rather than imported: this stored schema is
// pinned to COHORT_METRICS_VERSION and must stay frozen, while the API DTO is
// free to evolve. Coupling them would let a DTO change silently reinterpret
// rows already written under an older version. If this shape ever needs to
// diverge from the DTO, bump the version rather than editing it in place.
export type CohortMetricsEntry = {
    cohortId: string;
    cohortType: CohortType;
    seasonNumber: number;
    startDate: string;
    totalParticipants: number;
    retainedStudents: number;
    retentionRate: number;
    avgAttendanceRate: number;
    completionRate: number;
};

export type CohortMetricsData = {
    computedAt: string; // ISO timestamp of the run
    cohorts: CohortMetricsEntry[]; // the per-cohort metrics array
};

export type MetricDataMap = {
    [MetricType.COHORT_METRICS]: CohortMetricsData;
};

export type MetricData<T extends MetricType> = MetricDataMap[T];
