import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { ServiceError } from '@/common/errors';

interface RequestContext {
    method: string;
    url: string;
}

@Injectable()
export class DiscordAlertService {
    private readonly logger = new Logger(DiscordAlertService.name);
    private readonly webhookUrl: string | undefined;
    private alertCount = 0;
    private windowStart = Date.now();

    private static readonly MAX_ALERTS_PER_MINUTE = 10;
    private static readonly WINDOW_MS = 60_000;
    private static readonly MAX_STACK_LENGTH = 1010;

    constructor(private readonly configService: ConfigService) {
        this.webhookUrl = this.configService.get<string>(
            'monitoring.discordErrorWebhookUrl',
        );
    }

    async sendErrorAlert(
        error: ServiceError,
        request?: RequestContext,
    ): Promise<void> {
        if (!this.webhookUrl) return;
        if (this.isRateLimited()) return;

        const truncatedStack = (error.stack || 'No stack trace').slice(
            0,
            DiscordAlertService.MAX_STACK_LENGTH,
        );

        const title = error.message?.slice(0, 249) || 'Unknown error';

        const fields = [
            { name: 'Error ID', value: `\`${error.errorId}\``, inline: true },
            { name: 'Trace ID', value: `\`${error.traceId}\``, inline: true },
        ];

        if (request) {
            fields.push({
                name: 'Endpoint',
                value: `\`${request.method} ${request.url}\``,
                inline: false,
            });
        }

        fields.push({
            name: 'Stack Trace',
            value: `\`\`\`\n${truncatedStack}\n\`\`\``,
            inline: false,
        });

        const embed = {
            title: `Error: ${title}`,
            color: 0xff0000,
            fields,
            timestamp: new Date().toISOString(),
        };

        axios
            .post(this.webhookUrl, { embeds: [embed] })
            .catch((err) =>
                this.logger.warn(
                    `Failed to send Discord alert: ${err.message}`,
                    JSON.stringify(err.response?.data),
                ),
            );
    }

    private isRateLimited(): boolean {
        const now = Date.now();

        if (now - this.windowStart > DiscordAlertService.WINDOW_MS) {
            this.alertCount = 0;
            this.windowStart = now;
        }

        this.alertCount++;
        return this.alertCount > DiscordAlertService.MAX_ALERTS_PER_MINUTE;
    }
}
