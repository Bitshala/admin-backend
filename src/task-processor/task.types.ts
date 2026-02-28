import { TaskType } from '@/task-processor/task.enums';
import { CohortType } from '@/common/enum';

export type AssignCohortRoleTaskData = {
    userId: string;
    cohortType: CohortType;
};

export type SyncClassroomScoresTaskData = {
    cohortId: string;
};

export type TaskDataMap = {
    [TaskType.ASSIGN_COHORT_ROLE]: AssignCohortRoleTaskData;
    [TaskType.SYNC_CLASSROOM_SCORES]: SyncClassroomScoresTaskData;
};

export type TaskData<T extends TaskType> = TaskDataMap[T];
