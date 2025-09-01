import { Inject, Injectable } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { randomUUID } from 'crypto';
import { SessionData } from '@/auth/auth.interface';

@Injectable()
export class SessionStoreService {
    private readonly prefix = 'sess:';

    constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) {}

    private generateSessionId(): string {
        return randomUUID();
    }

    private generateCacheKey(sessionId: string): string {
        return this.prefix + sessionId;
    }

    async create(data: SessionData, ttlMs: number): Promise<string> {
        const sessionId = this.generateSessionId();
        await this.cacheManager.set<SessionData>(
            this.generateCacheKey(sessionId),
            data,
            ttlMs,
        );
        return sessionId;
    }

    async get(sessionId: string): Promise<SessionData | null> {
        return await this.cacheManager.get<SessionData>(
            this.generateCacheKey(sessionId),
        );
    }

    async destroy(sessionId: string): Promise<void> {
        await this.cacheManager.del(this.generateCacheKey(sessionId));
    }

    async update(sessionId: string, data: Partial<SessionData>): Promise<void> {
        const key = this.generateCacheKey(sessionId);
        const raw: SessionData | null =
            await this.cacheManager.get<SessionData>(key);
        if (!raw) return;

        const merged: SessionData = { ...raw, ...data };
        const ttl: number = (await this.cacheManager.ttl(key)) || 0;

        await this.cacheManager.set(
            key,
            JSON.stringify(merged),
            Math.max(ttl, 1),
        );
    }
}
