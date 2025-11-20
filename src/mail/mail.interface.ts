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

export interface TemplateContextMap {
    [MailTemplate.WelcomeToWaitlist]: WelcomeToWaitlistContext;
    [MailTemplate.CohortJoiningConfirmation]: CohortJoiningConfirmationContext;
}
