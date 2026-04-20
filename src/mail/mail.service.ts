import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { MailCoreService } from '@/mail/mail.core.service';
import { CohortType, FellowshipType } from '@/common/enum';
import { ServiceError } from '@/common/errors';
import { join } from 'path';
import { Eta } from 'eta';
import { MailTemplate } from '@/mail/mail.enum';
import { accessSync, constants } from 'fs';
import { TemplateContextMap } from '@/mail/mail.interface';
import { DISCORD_GENERAL_INVITE_URL } from '@/common/constants';
import { ConfigService } from '@nestjs/config';
import { Attachment } from 'nodemailer/lib/mailer';

@Injectable()
export class MailService implements OnModuleInit {
    private readonly logger = new Logger();

    // we need to use 'any' here because the Eta types are not very good
    // we would have to upgrade to TS v5.0+ to use proper types
    private readonly eta: any;

    constructor(
        private readonly coreService: MailCoreService,
        private readonly configService: ConfigService,
    ) {
        // we need to use 'any' here because the Eta types are not very good
        // we would have to upgrade to TS v5.0+ to use proper types
        this.eta = new (Eta as any)({
            views: this.getTemplateBaseDirectory(),
            cache: true,
        });
    }

    private getTemplateBaseDirectory(): string {
        return join(__dirname, '..', 'assets', 'mail-templates');
    }

    private assertFileExists(filePath: string): void {
        try {
            accessSync(filePath, constants.R_OK);
        } catch (err) {
            throw new ServiceError(`Missing template: ${filePath}`);
        }
    }

    private fileNameToPaths(template: MailTemplate): {
        html: string;
        text: string;
    } {
        return {
            html: `${template}.html.eta`,
            text: `${template}.text.eta`,
        };
    }

    onModuleInit(): void {
        const baseDir = this.getTemplateBaseDirectory();

        this.logger.log(`Validating email templates in: ${baseDir}`);

        for (const name of Object.values<string>(MailTemplate)) {
            const htmlPath = join(baseDir, `${name}.html.eta`);
            this.assertFileExists(htmlPath);

            const textPath = join(baseDir, `${name}.text.eta`);
            this.assertFileExists(textPath);
        }

        this.logger.log('All email templates validated successfully.');
    }

    private getCohortDisplayName(cohortType: CohortType): string {
        return this.getCohortShortName(cohortType) + ' Cohort';
    }

    getCohortShortName(cohortType: CohortType): string {
        switch (cohortType) {
            case CohortType.MASTERING_BITCOIN:
                return 'MB';
            case CohortType.LEARNING_BITCOIN_FROM_COMMAND_LINE:
                return 'LBTCL';
            case CohortType.PROGRAMMING_BITCOIN:
                return 'PB';
            case CohortType.BITCOIN_PROTOCOL_DEVELOPMENT:
                return 'BPD';
            case CohortType.MASTERING_LIGHTNING_NETWORK:
                return 'LN';
            default:
                throw new ServiceError(
                    `Unknown cohort type encountered: ${cohortType}`,
                );
        }
    }

    private getDiscordChannelCategoryName(cohortType: CohortType): string {
        switch (cohortType) {
            case CohortType.MASTERING_BITCOIN:
                return 'Mastering Bitcoin';
            case CohortType.LEARNING_BITCOIN_FROM_COMMAND_LINE:
                return 'Learning Bitcoin from the Command Line';
            case CohortType.PROGRAMMING_BITCOIN:
                return 'Programming Bitcoin';
            case CohortType.BITCOIN_PROTOCOL_DEVELOPMENT:
                return 'Bitcoin Protocol Development';
            case CohortType.MASTERING_LIGHTNING_NETWORK:
                return 'Mastering the Lightning Network';
            default:
                throw new ServiceError(
                    `Unknown cohort type encountered: ${cohortType}`,
                );
        }
    }

    private getCohortInviteLink(cohortType: CohortType): string {
        switch (cohortType) {
            case CohortType.MASTERING_BITCOIN:
                return this.configService.getOrThrow<string>(
                    'discord.inviteUrls.masteringBitcoin',
                );
            case CohortType.LEARNING_BITCOIN_FROM_COMMAND_LINE:
                return this.configService.getOrThrow<string>(
                    'discord.inviteUrls.learningBitcoinFromCommandLine',
                );
            case CohortType.PROGRAMMING_BITCOIN:
                return this.configService.getOrThrow<string>(
                    'discord.inviteUrls.programmingBitcoin',
                );
            case CohortType.BITCOIN_PROTOCOL_DEVELOPMENT:
                return this.configService.getOrThrow<string>(
                    'discord.inviteUrls.bitcoinProtocolDevelopment',
                );
            case CohortType.MASTERING_LIGHTNING_NETWORK:
                return this.configService.getOrThrow<string>(
                    'discord.inviteUrls.masteringLightningNetwork',
                );
            default:
                throw new ServiceError(
                    `Unknown cohort type encountered: ${cohortType}`,
                );
        }
    }

    private async sendTemplatedEmail<K extends MailTemplate>(options: {
        to: string;
        from?: string;
        subject: string;
        template: K;
        context: TemplateContextMap[K];
        attachments?: Attachment[];
        icalEvent?: { method: string; content: string };
    }): Promise<void> {
        const templateConfig = this.fileNameToPaths(options.template);

        const html = this.eta.render(templateConfig.html, options.context);
        const text = this.eta.render(templateConfig.text, options.context);

        await this.coreService.sendEmail({
            to: options.to,
            from: options.from,
            subject: options.subject,
            html: html,
            text: text,
            attachments: options.attachments,
            icalEvent: options.icalEvent,
        });
    }

    async sendWelcomeToWaitlistEmail(
        userEmail: string,
        userName: string,
        cohortType: CohortType,
    ): Promise<void> {
        const cohortDisplayName = this.getCohortDisplayName(cohortType);
        const subject = `Welcome to the ${cohortDisplayName} waitlist, ${userName}!`;

        return this.sendTemplatedEmail({
            to: userEmail,
            subject: subject,
            template: MailTemplate.WelcomeToWaitlist,
            context: {
                userName: userName,
                cohortName: cohortDisplayName,
                discordLink: DISCORD_GENERAL_INVITE_URL,
            },
        });
    }

    async sendCohortJoiningConfirmationEmail(
        userEmail: string,
        userName: string,
        cohortType: CohortType,
        calendarInvite?: string,
    ): Promise<void> {
        const cohortDisplayName = this.getCohortDisplayName(cohortType);
        const cohortCategory = this.getDiscordChannelCategoryName(cohortType);
        const discordInviteLink = this.getCohortInviteLink(cohortType);
        const subject = `Welcome to ${cohortDisplayName} - Your enrollment is confirmed!`;

        return this.sendTemplatedEmail({
            to: userEmail,
            subject: subject,
            template: MailTemplate.CohortJoiningConfirmation,
            context: {
                userName: userName,
                cohortName: cohortDisplayName,
                discordInviteLink: discordInviteLink,
                discordSupportLink: discordInviteLink,
                cohortCategory: cohortCategory,
            },
            icalEvent: calendarInvite
                ? { method: 'REQUEST', content: calendarInvite }
                : undefined,
        });
    }

    async sendCohortOrientationReminderEmail(
        userEmail: string,
        userName: string,
        cohortType: CohortType,
        startDate: string,
        startTime: string,
        frequency: string,
        location: string,
    ): Promise<void> {
        const cohortDisplayName = this.getCohortDisplayName(cohortType);
        const cohortShortName = this.getCohortShortName(cohortType);
        const subject = `Reminder: ${cohortDisplayName} Orientation — ${startDate}`;

        return this.sendTemplatedEmail({
            to: userEmail,
            subject: subject,
            template: MailTemplate.CohortOrientationReminder,
            context: {
                userName: userName,
                cohortName: cohortDisplayName,
                cohortShortName: cohortShortName,
                startDate: startDate,
                startTime: startTime,
                frequency: frequency,
                location: location,
            },
        });
    }

    async sendCohortGdSessionReminderEmail(
        userEmail: string,
        userName: string,
        cohortName: string,
        season: string,
        sessionDay: string,
        sessionDate: string,
        sessionTime: string,
        channelName: string,
    ): Promise<void> {
        const subject = `${cohortName} ${season} — Session on ${sessionDay}, ${sessionDate}`;

        return this.sendTemplatedEmail({
            to: userEmail,
            subject: subject,
            template: MailTemplate.CohortGdSessionReminder,
            context: {
                userName: userName,
                cohortName: cohortName,
                season: season,
                sessionDay: sessionDay,
                sessionDate: sessionDate,
                sessionTime: sessionTime,
                channelName: channelName,
            },
        });
    }

    async sendCohortGraduationReminderEmail(
        userEmail: string,
        userName: string,
        cohortName: string,
        season: string,
        sessionDate: string,
        sessionTime: string,
        channelName: string,
    ): Promise<void> {
        const subject = `Bitshala ${cohortName} ${season} Graduation Call Today!`;

        return this.sendTemplatedEmail({
            to: userEmail,
            subject: subject,
            template: MailTemplate.CohortGraduationReminder,
            context: {
                userName: userName,
                cohortName: cohortName,
                season: season,
                sessionDate: sessionDate,
                sessionTime: sessionTime,
                channelName: channelName,
            },
        });
    }

    async sendCohortFeedbackReminderEmail(
        userEmail: string,
        userName: string,
        cohortName: string,
        season: string,
    ): Promise<void> {
        const subject = `Bitshala ${cohortName} ${season} Feedback Survey!`;

        return this.sendTemplatedEmail({
            to: userEmail,
            subject: subject,
            template: MailTemplate.CohortFeedbackReminder,
            context: {
                userName: userName,
                cohortName: cohortName,
                season: season,
            },
        });
    }

    async sendCohortCertificateEmail(
        userEmail: string,
        userName: string,
        cohortName: string,
        season: string,
        certificateFile: Buffer,
        certificateFileName: string,
    ): Promise<void> {
        const subject = `Your Bitshala ${cohortName} ${season} Certificate 🎓`;

        return this.sendTemplatedEmail({
            to: userEmail,
            subject: subject,
            template: MailTemplate.CohortCertificate,
            context: {
                userName: userName,
                cohortName: cohortName,
                season: season,
            },
            attachments: [
                {
                    filename: certificateFileName,
                    content: certificateFile,
                    contentType: 'application/pdf',
                },
            ],
        });
    }

    async sendCalendarUpdateEmail(
        userEmail: string,
        userName: string,
        cohortName: string,
        season: string,
        calendarInvite: string,
    ): Promise<void> {
        const subject = `Schedule Update: ${cohortName} ${season}`;

        return this.sendTemplatedEmail({
            to: userEmail,
            subject,
            template: MailTemplate.CohortCalendarUpdate,
            context: {
                userName,
                cohortName,
                season,
            },
            icalEvent: { method: 'REQUEST', content: calendarInvite },
        });
    }

    private getFellowshipTypeDisplayName(type: FellowshipType): string {
        switch (type) {
            case FellowshipType.DEVELOPER:
                return 'Developer';
            case FellowshipType.DESIGNER:
                return 'Designer';
            case FellowshipType.EDUCATOR:
                return 'Educator';
        }
    }

    async sendFellowshipApplicationReceivedEmail(
        userEmail: string,
        userName: string,
        fellowshipType: FellowshipType,
    ): Promise<void> {
        const displayType = this.getFellowshipTypeDisplayName(fellowshipType);
        const subject = `Fellowship Application Received — ${displayType}`;

        return this.sendTemplatedEmail({
            to: userEmail,
            subject,
            template: MailTemplate.FellowshipApplicationReceived,
            context: {
                userName,
                fellowshipType: displayType,
            },
        });
    }

    async sendFellowshipApplicationAcceptedEmail(
        userEmail: string,
        userName: string,
        fellowshipType: FellowshipType,
    ): Promise<void> {
        const displayType = this.getFellowshipTypeDisplayName(fellowshipType);
        const subject = `Congratulations! Your ${displayType} Fellowship Application Has Been Accepted`;

        return this.sendTemplatedEmail({
            to: userEmail,
            subject,
            template: MailTemplate.FellowshipApplicationAccepted,
            context: {
                userName,
                fellowshipType: displayType,
            },
        });
    }

    async sendFellowshipApplicationRejectedEmail(
        userEmail: string,
        userName: string,
        fellowshipType: FellowshipType,
        reviewerRemarks: string,
    ): Promise<void> {
        const displayType = this.getFellowshipTypeDisplayName(fellowshipType);
        const subject = `Update on Your ${displayType} Fellowship Application`;

        return this.sendTemplatedEmail({
            to: userEmail,
            subject,
            template: MailTemplate.FellowshipApplicationRejected,
            context: {
                userName,
                fellowshipType: displayType,
                reviewerRemarks,
            },
        });
    }

    private getMonthName(month: number): string {
        const months = [
            'January',
            'February',
            'March',
            'April',
            'May',
            'June',
            'July',
            'August',
            'September',
            'October',
            'November',
            'December',
        ];
        return months[month - 1];
    }

    async sendFellowshipReportReminderEmail(
        userEmail: string,
        userName: string,
        month: number,
        year: number,
    ): Promise<void> {
        const monthName = this.getMonthName(month);
        const subject = `Reminder: Submit Your Fellowship Report for ${monthName} ${year}`;

        return this.sendTemplatedEmail({
            to: userEmail,
            subject,
            template: MailTemplate.FellowshipReportReminder,
            context: {
                userName,
                monthName,
                year,
            },
        });
    }

    async sendFellowshipReportApprovedEmail(
        userEmail: string,
        userName: string,
        month: number,
        year: number,
    ): Promise<void> {
        const monthName = this.getMonthName(month);
        const subject = `Fellowship Report Approved — ${monthName} ${year}`;

        return this.sendTemplatedEmail({
            to: userEmail,
            subject,
            template: MailTemplate.FellowshipReportApproved,
            context: {
                userName,
                monthName,
                year,
            },
        });
    }

    async sendFellowshipReportRejectedEmail(
        userEmail: string,
        userName: string,
        month: number,
        year: number,
        reviewerRemarks: string,
    ): Promise<void> {
        const monthName = this.getMonthName(month);
        const subject = `Fellowship Report Update — ${monthName} ${year}`;

        return this.sendTemplatedEmail({
            to: userEmail,
            subject,
            template: MailTemplate.FellowshipReportRejected,
            context: {
                userName,
                monthName,
                year,
                reviewerRemarks,
            },
        });
    }
}
