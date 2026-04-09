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

export interface CohortCalendarUpdateContext {
    userName: string;
    cohortName: string;
    season: string;
}

export interface FellowshipApplicationReceivedContext {
    userName: string;
    fellowshipType: string;
}

export interface FellowshipApplicationAcceptedContext {
    userName: string;
    fellowshipType: string;
}

export interface FellowshipApplicationRejectedContext {
    userName: string;
    fellowshipType: string;
    reviewerRemarks: string;
}

export interface FellowshipReportReminderContext {
    userName: string;
    monthName: string;
    year: number;
}

export interface FellowshipReportApprovedContext {
    userName: string;
    monthName: string;
    year: number;
}

export interface FellowshipReportRejectedContext {
    userName: string;
    monthName: string;
    year: number;
    reviewerRemarks: string;
}

export interface TemplateContextMap {
    [MailTemplate.WelcomeToWaitlist]: WelcomeToWaitlistContext;
    [MailTemplate.CohortJoiningConfirmation]: CohortJoiningConfirmationContext;
    [MailTemplate.CohortOrientationReminder]: CohortOrientationReminderContext;
    [MailTemplate.CohortGdSessionReminder]: CohortGdSessionReminderContext;
    [MailTemplate.CohortGraduationReminder]: CohortGraduationReminderContext;
    [MailTemplate.CohortCertificate]: CohortCertificateContext;
    [MailTemplate.CohortFeedbackReminder]: CohortFeedbackReminderContext;
    [MailTemplate.CohortCalendarUpdate]: CohortCalendarUpdateContext;
    [MailTemplate.FellowshipApplicationReceived]: FellowshipApplicationReceivedContext;
    [MailTemplate.FellowshipApplicationAccepted]: FellowshipApplicationAcceptedContext;
    [MailTemplate.FellowshipApplicationRejected]: FellowshipApplicationRejectedContext;
    [MailTemplate.FellowshipReportReminder]: FellowshipReportReminderContext;
    [MailTemplate.FellowshipReportApproved]: FellowshipReportApprovedContext;
    [MailTemplate.FellowshipReportRejected]: FellowshipReportRejectedContext;
}
