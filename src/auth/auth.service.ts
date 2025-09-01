import {
    Inject,
    Injectable,
    Logger,
    UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SessionStoreService } from '@/auth/session-store.service';
import { SessionData } from '@/auth/auth.interface';
import { DiscordClient } from '@/discord-client/discord.client';
import { randomBytes } from 'crypto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { UsersService } from '@/users/users.service';

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);

    private readonly oauthStateCacheKeyPrefix = 'oauth_state:';
    private readonly oauthStateTtlMs: number;
    private readonly oauthSessionTtlMs: number;

    private readonly appBaseUrl: string;
    private readonly dashboardRedirectPath: string;

    private readonly discordClientId: string;
    private readonly discordOauthUri: string;
    private readonly discordRedirectUri: string;
    private readonly discordScopes: string[];

    constructor(
        @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
        private readonly configService: ConfigService,
        private readonly sessionStore: SessionStoreService,
        private readonly discordClient: DiscordClient,
        private readonly usersService: UsersService,
    ) {
        this.oauthStateTtlMs =
            this.configService.getOrThrow<number>('discord.stateTtlSeconds') *
            1000;
        this.oauthSessionTtlMs =
            this.configService.getOrThrow<number>(
                'app.auth.sessionTtlSeconds',
            ) * 1000;
        this.appBaseUrl = this.configService.getOrThrow<string>('app.baseUrl');
        this.dashboardRedirectPath = this.configService.getOrThrow<string>(
            'app.auth.dashboardRedirectPath',
        );
        this.discordClientId =
            this.configService.getOrThrow<string>('discord.clientId');
        this.discordOauthUri =
            this.configService.getOrThrow<string>('discord.oauthUrl');
        this.discordScopes =
            this.configService.getOrThrow<string[]>('discord.authScopes');
        this.discordRedirectUri = new URL(
            this.configService.getOrThrow<string>('app.auth.callbackPath'),
            this.appBaseUrl,
        ).toString();
    }

    async buildAuthorizeUrl(): Promise<string> {
        const state = randomBytes(24).toString('base64url');

        await this.cacheManager.set(
            this.oauthStateCacheKeyPrefix + state,
            true,
            this.oauthStateTtlMs,
        );

        const params = new URLSearchParams({
            response_type: 'code',
            client_id: this.discordClientId,
            redirect_uri: this.discordRedirectUri,
            scope: this.discordScopes.join(' '),
            state,
            prompt: 'consent',
        });

        return `${this.discordOauthUri}?${params.toString()}`;
    }

    buildDashboardUrl(sessionId: string): string {
        const url = new URL(this.dashboardRedirectPath, this.appBaseUrl);
        const params = new URLSearchParams({
            ok: '1',
            session_id: sessionId,
        });
        return `${url.toString()}?${params.toString()}`;
    }

    async createSessionFromDiscord(
        state: string | undefined,
        code: string | undefined,
    ): Promise<string> {
        if (!state) {
            throw new UnauthorizedException('Invalid OAuth state');
        }
        if (!code) {
            throw new UnauthorizedException('Missing code');
        }

        const tokens = await this.discordClient.exchangeCodeForTokens(code);
        const discordUser = await this.discordClient.fetchDiscordUser(
            tokens.access_token,
        );

        const user = await this.usersService.upsertUser({
            email: discordUser.email || null,
            discordUserId: discordUser.id,
            discordUsername: discordUser.username,
            discordGlobalName: discordUser.global_name || discordUser.username,
        });

        const expiresAt = Date.now() + tokens.expires_in * 1000;
        const session: SessionData = {
            userId: user.id,
            discordId: discordUser.id,
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token,
            expiresAt,
        };

        return await this.sessionStore.create(session, this.oauthSessionTtlMs);
    }

    async getUserFromSession(sessionId: string) {
        const session = await this.getSession(sessionId);
        return this.usersService.findByUserId(session.userId);
    }

    async getSession(sessionId: string): Promise<SessionData> {
        const data = await this.sessionStore.get(sessionId);
        if (!data) throw new UnauthorizedException('Invalid session');
        return data;
    }

    async destroySession(sessionId: string): Promise<void> {
        const session = await this.getSession(sessionId);
        await this.sessionStore.destroy(sessionId);
        await this.discordClient.revokeToken(session.accessToken);
    }
}
