import {
    Injectable,
    Logger,
    OnApplicationBootstrap,
    OnApplicationShutdown,
} from '@nestjs/common';
import { Transporter } from 'nodemailer';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailCoreService
    implements OnApplicationBootstrap, OnApplicationShutdown
{
    private readonly logger = new Logger(MailCoreService.name);

    private readonly transporter: Transporter;
    private readonly from: string;

    constructor(private readonly configService: ConfigService) {
        const smtpHost =
            this.configService.getOrThrow<string>('email.smtp.host');
        const smtpPort =
            this.configService.getOrThrow<number>('email.smtp.port');
        const smtpSecure =
            this.configService.getOrThrow<boolean>('email.smtp.secure');
        const smtpUser =
            this.configService.getOrThrow<string>('email.smtp.user');
        const smtpPass =
            this.configService.getOrThrow<string>('email.smtp.pass');

        const fromEmail =
            this.configService.getOrThrow<string>('email.from.email');
        const fromName =
            this.configService.getOrThrow<string>('email.from.name');

        this.from = `"${fromName}" <${fromEmail}>`;

        this.transporter = nodemailer.createTransport({
            host: smtpHost,
            port: smtpPort,
            secure: smtpSecure,
            auth: {
                user: smtpUser,
                pass: smtpPass,
            },
        });
    }

    async onApplicationBootstrap() {
        try {
            await this.transporter.verify();
            this.logger.log('Email transporter connection verified.');
        } catch (error) {
            this.logger.error(
                `Error verifying email transporter connection: ${error.message}`,
                error.stack,
            );
            throw error;
        }
    }

    onApplicationShutdown() {
        try {
            this.transporter.close();
            this.logger.log('Email transporter connection closed.');
        } catch (error) {
            this.logger.error(
                `Error closing email transporter connection: ${error.message}`,
                error.stack,
            );
        }
    }

    async sendEmail(options: {
        to: string;
        subject: string;
        html: string;
        text?: string;
        from?: string;
    }): Promise<void> {
        try {
            await this.transporter.sendMail({
                from: options.from || this.from,
                to: options.to,
                subject: options.subject,
                html: options.html,
                text: options.text,
            });
        } catch (error) {
            this.logger.error(error.message, error.stack);
            throw error;
        }
    }
}
