import { Module } from '@nestjs/common';
import { DiscordClient } from '@/discord-client/discord.client';

@Module({
    imports: [],
    providers: [DiscordClient],
    controllers: [],
    exports: [DiscordClient],
})
export class DiscordClientModule {}
