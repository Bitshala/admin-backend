import { TaskType } from '@/task-processor/task.enums';
import { CohortType } from '@/common/enum';

export type AssignCohortRoleTaskData = {
    userId: string;
    cohortType: CohortType;
};

export type TaskDataMap = {
    [TaskType.ASSIGN_COHORT_ROLE]: AssignCohortRoleTaskData;
};

export type TaskData<T extends TaskType> = TaskDataMap[T];
