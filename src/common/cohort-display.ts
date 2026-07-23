import { CohortType } from '@/common/enum';
import { ServiceError } from '@/common/errors';

/**
 * Human-readable, full display names per cohort type. This is the single source
 * of truth for cohort display names — consumed by both the mail templates and
 * the cohorts API response. Names are not derivable from the enum value (they
 * contain articles/casing the slug transform loses), so they are mapped here.
 */
const COHORT_FULL_NAMES: Record<CohortType, string> = {
    [CohortType.MASTERING_BITCOIN]: 'Mastering Bitcoin',
    [CohortType.LEARNING_BITCOIN_FROM_COMMAND_LINE]:
        'Learning Bitcoin from the Command Line',
    [CohortType.PROGRAMMING_BITCOIN]: 'Programming Bitcoin',
    [CohortType.BITCOIN_PROTOCOL_DEVELOPMENT]: 'Bitcoin Protocol Development',
    [CohortType.MASTERING_LIGHTNING_NETWORK]: 'Mastering the Lightning Network',
    [CohortType.BUILDING_BITCOIN_IN_RUST]: 'Building Bitcoin in Rust',
};

export function getCohortFullName(cohortType: CohortType): string {
    const name = COHORT_FULL_NAMES[cohortType];
    if (!name) {
        throw new ServiceError(
            `Unknown cohort type encountered: ${cohortType}`,
        );
    }
    return name;
}
