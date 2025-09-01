import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios';
import { ServiceError } from '@/common/errors';
import { ConfigService } from '@nestjs/config';
import { DiscordTokenResponse, DiscordUser } from '@/discord-client/response';

@Injectable()
export class DiscordClient {
    private readonly logger = new Logger(DiscordClient.name);
    private readonly axios: AxiosInstance;
    private readonly clientId: string;
    private readonly clientSecret: string;
    private readonly callbackUrl: string;

    constructor(private readonly configService: ConfigService) {
        this.axios = axios.create({
            baseURL: this.configService.get<string>('discord.apiBaseUrl'),
        });
        this.clientId =
            this.configService.getOrThrow<string>('discord.clientId');
        this.clientSecret = this.configService.getOrThrow<string>(
            'discord.clientSecret',
        );
        this.callbackUrl = new URL(
            this.configService.getOrThrow<string>('app.auth.callbackPath'),
            this.configService.getOrThrow<string>('app.baseUrl'),
        ).toString();
    }

    private async executeRequest<T>(
        config: AxiosRequestConfig,
        attempt = 1,
        maxRetries = 3,
    ): Promise<T> {
        try {
            const response = await this.axios.request<T>(config);
            return response.data;
        } catch (error) {
            if (
                error instanceof AxiosError &&
                error.response?.status === 429 &&
                config.method?.toUpperCase() === 'GET' &&
                attempt < maxRetries
            ) {
                await new Promise((resolve) =>
                    setTimeout(resolve, 1000 * attempt),
                );
                return this.executeRequest<T>(config, attempt + 1, maxRetries);
            }

            if (error instanceof AxiosError && error.response) {
                this.logger.error(
                    `Request to Discord failed!\nURL:\n${
                        config.url
                    }\nStatus code ${
                        error.response.status
                    }\nReason ${JSON.stringify(error.response.data)}`,
                );
                throw new ServiceError(JSON.stringify(error.response.data), {
                    cause: error,
                });
            }

            this.logger.error(error.message, error.stack);
            throw error;
        }
    }

    async exchangeCodeForTokens(code: string): Promise<DiscordTokenResponse> {
        const data = new URLSearchParams({
            grant_type: 'authorization_code',
            code,
            redirect_uri: this.callbackUrl,
        });

        return await this.executeRequest<DiscordTokenResponse>({
            method: 'POST',
            url: '/oauth2/token',
            data,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            auth: {
                username: this.clientId,
                password: this.clientSecret,
            },
        });
    }

    async refreshTokens(refreshToken: string): Promise<DiscordTokenResponse> {
        const data = new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: refreshToken,
        });

        return await this.executeRequest<DiscordTokenResponse>({
            method: 'POST',
            url: '/oauth2/token',
            data,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            auth: {
                username: this.clientId,
                password: this.clientSecret,
            },
        });
    }

    async revokeToken(token: string): Promise<void> {
        const data = new URLSearchParams({
            token,
            token_type_hint: 'access_token',
        });

        return await this.executeRequest({
            method: 'POST',
            url: '/oauth2/token/revoke',
            data,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            auth: {
                username: this.clientId,
                password: this.clientSecret,
            },
        });
    }

    async fetchDiscordUser(accessToken: string): Promise<DiscordUser> {
        return await this.executeRequest<DiscordUser>({
            method: 'GET',
            url: '/users/@me',
            headers: { Authorization: `Bearer ${accessToken}` },
        });
    }
}
