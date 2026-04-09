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

export type SendCertificateEmailsTaskData = {
    cohortId: string;
};

export type SendFeedbackReminderEmailsTaskData = {
    cohortId: string;
};

export type SendCalendarUpdateEmailsTaskData = {
    cohortId: string;
};

export type SendFellowshipReportReminderEmailsTaskData = {
    month: number;
    year: number;
};

export type TaskDataMap = {
    [TaskType.ASSIGN_COHORT_ROLE]: AssignCohortRoleTaskData;
    [TaskType.SYNC_CLASSROOM_SCORES]: SyncClassroomScoresTaskData;
    [TaskType.SEND_COHORT_REMINDER_EMAILS]: SendCohortReminderEmailsTaskData;
    [TaskType.SEND_CERTIFICATE_EMAILS]: SendCertificateEmailsTaskData;
    [TaskType.SEND_FEEDBACK_REMINDER_EMAILS]: SendFeedbackReminderEmailsTaskData;
    [TaskType.SEND_CALENDAR_UPDATE_EMAILS]: SendCalendarUpdateEmailsTaskData;
    [TaskType.SEND_FELLOWSHIP_REPORT_REMINDER_EMAILS]: SendFellowshipReportReminderEmailsTaskData;
};

export type TaskData<T extends TaskType> = TaskDataMap[T];
