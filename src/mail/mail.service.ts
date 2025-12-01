import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { MailCoreService } from '@/mail/mail.core.service';
import { CohortType } from '@/common/enum';
import { ServiceError } from '@/common/errors';
import { join } from 'path';
import { Eta } from 'eta';
import { MailTemplate } from '@/mail/mail.enum';
import { accessSync, constants } from 'fs';
import { TemplateContextMap } from '@/mail/mail.interface';
import { DISCORD_GENERAL_INVITE_URL } from '@/common/constants';
import { ConfigService } from '@nestjs/config';

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
        switch (process.env.NODE_ENV) {
            case 'e2e':
                return join(__dirname, '..', 'mail-templates');
            case 'dev':
            default:
                return join(__dirname, 'mail-templates');
        }
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
        switch (cohortType) {
            case CohortType.MASTERING_BITCOIN:
                return 'MB Cohort';
            case CohortType.LEARNING_BITCOIN_FROM_COMMAND_LINE:
                return 'LBTCL Cohort';
            case CohortType.PROGRAMMING_BITCOIN:
                return 'PB Cohort';
            case CohortType.BITCOIN_PROTOCOL_DEVELOPMENT:
                return 'BPD Cohort';
            case CohortType.MASTERING_LIGHTNING_NETWORK:
                return 'LN Cohort';
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
        });
    }
}
