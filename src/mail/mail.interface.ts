import { MailTemplate } from '@/mail/mail.enum';

export interface WelcomeToWaitlistContext {
    userName: string;
    cohortName: string;
}

export interface CohortJoiningConfirmationContext {
    userName: string;
    cohortName: string;
    startDate: string;
    endDate: string;
    classroomUrl?: string;
}

export interface TemplateContextMap {
    [MailTemplate.WelcomeToWaitlist]: WelcomeToWaitlistContext;
    [MailTemplate.CohortJoiningConfirmation]: CohortJoiningConfirmationContext;
}
