import { Cohort } from '@/entities/cohort.entity';
import { CohortWeek } from '@/entities/cohort-week.entity';
import { ExerciseScore } from '@/entities/exercise-score.entity';
import { GroupDiscussionScore } from '@/entities/group-discussion-score.entity';
import { User } from '@/entities/user.entity';
import { APITask } from '@/entities/api-task.entity';

export const entities = [
    APITask,
    Cohort,
    CohortWeek,
    ExerciseScore,
    GroupDiscussionScore,
    User,
];
