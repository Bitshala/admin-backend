import { Attendance } from '@/entities/attendance.entity';
import { Cohort } from '@/entities/cohort.entity';
import { CohortWeek } from '@/entities/cohort-week.entity';
import { ExerciseScore } from '@/entities/exercise-score.entity';
import { GroupDiscussionScore } from '@/entities/group-discussion-score.entity';
import { User } from '@/entities/user.entity';
import { APITask } from '@/entities/api-task.entity';
import { Feedback } from '@/entities/feedback.entity';
import { FellowshipApplication } from '@/entities/fellowship-application.entity';
import { Fellowship } from '@/entities/fellowship.entity';

export const entities = [
    APITask,
    Attendance,
    Cohort,
    CohortWeek,
    ExerciseScore,
    Feedback,
    Fellowship,
    FellowshipApplication,
    GroupDiscussionScore,
    User,
];
