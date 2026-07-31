import { CohortWeekType } from '@/common/enum';
import { Cohort } from '@/entities/cohort.entity';
import { CohortWeek } from '@/entities/cohort-week.entity';
import { CohortMetricsDto } from '@/cohorts/cohorts.response.dto';

type MetricsCohort = Pick<Cohort, 'id' | 'type' | 'season' | 'startDate'> & {
    weeks: Pick<CohortWeek, 'id' | 'week' | 'type' | 'scheduledDate'>[];
    memberships: unknown[];
};

// attendedCountByWeek maps a CohortWeek id -> number of members who attended that week.
export function computeCohortMetrics(
    cohort: MetricsCohort,
    attendedCountByWeek: ReadonlyMap<string, number>,
    now: Date,
): CohortMetricsDto {
    const totalParticipants = cohort.memberships.length;
    const completedWeeks = cohort.weeks
        .filter((week) => week.scheduledDate <= now)
        .sort((a, b) => a.week - b.week);
    const graduationWeek = cohort.weeks.find(
        (week) => week.type === CohortWeekType.GRADUATION,
    );

    const weeklyAttendanceRates = totalParticipants
        ? completedWeeks.map(
              (week) =>
                  (attendedCountByWeek.get(week.id) ?? 0) / totalParticipants,
          )
        : [];
    const avgAttendanceRate = weeklyAttendanceRates.length
        ? weeklyAttendanceRates.reduce((sum, rate) => sum + rate, 0) /
          weeklyAttendanceRates.length
        : 0;

    // Retention = how many registered members are still showing up as of the
    // most recently completed week (the latest point in the attendance trend).
    const lastCompletedWeek = completedWeeks[completedWeeks.length - 1];
    const retainedStudents =
        totalParticipants && lastCompletedWeek
            ? (attendedCountByWeek.get(lastCompletedWeek.id) ?? 0)
            : 0;
    const retentionRate = totalParticipants
        ? retainedStudents / totalParticipants
        : 0;

    const completedStudents =
        totalParticipants && graduationWeek
            ? (attendedCountByWeek.get(graduationWeek.id) ?? 0)
            : 0;
    const completionRate = totalParticipants
        ? completedStudents / totalParticipants
        : 0;

    return new CohortMetricsDto({
        cohortId: cohort.id,
        cohortType: cohort.type,
        seasonNumber: cohort.season,
        startDate: cohort.startDate.toISOString(),
        totalParticipants,
        retainedStudents,
        retentionRate,
        avgAttendanceRate,
        completionRate,
    });
}
