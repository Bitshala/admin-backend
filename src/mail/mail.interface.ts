import { MailTemplate } from '@/mail/mail.enum';

export interface WelcomeToWaitlistContext {
    userName: string;
    cohortName: string;
    discordLink: string;
}

export interface CohortJoiningConfirmationContext {
    userName: string;
    cohortName: string;
    discordInviteLink: string;
    discordSupportLink: string;
    cohortCategory: string;
}

export interface CohortOrientationReminderContext {
    userName: string;
    cohortName: string;
    cohortShortName: string;
    startDate: string;
    startTime: string;
    frequency: string;
    location: string;
}

export interface CohortGdSessionReminderContext {
    userName: string;
    cohortName: string;
    season: string;
    sessionDay: string;
    sessionDate: string;
    sessionTime: string;
    channelName: string;
}

export interface CohortGraduationReminderContext {
    userName: string;
    cohortName: string;
    season: string;
    sessionDate: string;
    sessionTime: string;
    channelName: string;
}

export interface CohortCertificateContext {
    userName: string;
    cohortName: string;
    season: string;
}

export interface CohortFeedbackReminderContext {
    userName: string;
    cohortName: string;
    season: string;
}

export interface TemplateContextMap {
    [MailTemplate.WelcomeToWaitlist]: WelcomeToWaitlistContext;
    [MailTemplate.CohortJoiningConfirmation]: CohortJoiningConfirmationContext;
    [MailTemplate.CohortOrientationReminder]: CohortOrientationReminderContext;
    [MailTemplate.CohortGdSessionReminder]: CohortGdSessionReminderContext;
    [MailTemplate.CohortGraduationReminder]: CohortGraduationReminderContext;
    [MailTemplate.CohortCertificate]: CohortCertificateContext;
    [MailTemplate.CohortFeedbackReminder]: CohortFeedbackReminderContext;
}
