import { MailTemplate } from '@/mail/mail.enum';

export interface WelcomeToWaitlistContext {
    userName: string;
    cohortName: string;
}

export interface TemplateContextMap {
    [MailTemplate.WelcomeToWaitlist]: WelcomeToWaitlistContext;
}
