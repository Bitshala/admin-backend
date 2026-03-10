import { TaskType } from '@/task-processor/task.enums';
import { CohortType } from '@/common/enum';

export type AssignCohortRoleTaskData = {
    userId: string;
    cohortType: CohortType;
};

export type SyncClassroomScoresTaskData = {
    cohortId: string;
};

export type SendCohortReminderEmailsTaskData = {
    cohortId: string;
    cohortWeekId: string;
};

export type TaskDataMap = {
    [TaskType.ASSIGN_COHORT_ROLE]: AssignCohortRoleTaskData;
    [TaskType.SYNC_CLASSROOM_SCORES]: SyncClassroomScoresTaskData;
    [TaskType.SEND_COHORT_REMINDER_EMAILS]: SendCohortReminderEmailsTaskData;
};

export type TaskData<T extends TaskType> = TaskDataMap[T];
