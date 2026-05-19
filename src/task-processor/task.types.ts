import { TaskType } from '@/task-processor/task.enums';

export type AssignCohortRoleTaskData = {
    userId: string;
    cohortId: string;
};

export type ReconcileCohortDiscordRolesTaskData = {
    cohortId: string;
};

export type SyncClassroomScoresTaskData = {
    cohortId: string;
};

export type SendCohortReminderEmailsTaskData = {
    cohortId: string;
    cohortWeekId: string;
};

export type SendCertificateEmailsTaskData = {
    cohortId: string;
};

export type SendFeedbackReminderEmailsTaskData = {
    cohortId: string;
};

export type SendCalendarUpdateEmailsTaskData = {
    cohortId: string;
};

export type TaskDataMap = {
    [TaskType.ASSIGN_COHORT_ROLE]: AssignCohortRoleTaskData;
    [TaskType.RECONCILE_COHORT_DISCORD_ROLES]: ReconcileCohortDiscordRolesTaskData;
    [TaskType.SYNC_CLASSROOM_SCORES]: SyncClassroomScoresTaskData;
    [TaskType.SEND_COHORT_REMINDER_EMAILS]: SendCohortReminderEmailsTaskData;
    [TaskType.SEND_CERTIFICATE_EMAILS]: SendCertificateEmailsTaskData;
    [TaskType.SEND_FEEDBACK_REMINDER_EMAILS]: SendFeedbackReminderEmailsTaskData;
    [TaskType.SEND_CALENDAR_UPDATE_EMAILS]: SendCalendarUpdateEmailsTaskData;
};

export type TaskData<T extends TaskType> = TaskDataMap[T];
