import { Attendance } from '@/entities/attendance.entity';
import { Cohort } from '@/entities/cohort.entity';
import { CohortMembership } from '@/entities/cohort-membership.entity';
import { CohortWeek } from '@/entities/cohort-week.entity';
import { ComputedMetric } from '@/entities/computed-metric.entity';
import { ExerciseScore } from '@/entities/exercise-score.entity';
import { GroupDiscussionScore } from '@/entities/group-discussion-score.entity';
import { User } from '@/entities/user.entity';
import { APITask } from '@/entities/api-task.entity';
import { Feedback } from '@/entities/feedback.entity';
import { FellowshipApplication } from '@/entities/fellowship-application.entity';
import { FellowshipApplicationNote } from '@/entities/fellowship-application-note.entity';
import { Fellowship } from '@/entities/fellowship.entity';
import { FellowshipDocument } from '@/entities/fellowship-document.entity';
import { FellowshipReport } from '@/entities/fellowship-report.entity';
import { FellowshipReportNote } from '@/entities/fellowship-report-note.entity';

export const entities = [
    APITask,
    Attendance,
    Cohort,
    CohortMembership,
    CohortWeek,
    ComputedMetric,
    ExerciseScore,
    Feedback,
    Fellowship,
    FellowshipApplication,
    FellowshipApplicationNote,
    FellowshipDocument,
    FellowshipReport,
    FellowshipReportNote,
    GroupDiscussionScore,
    User,
];
