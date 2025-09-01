import { AuthService } from '@/auth/auth.service';
import { AuthController } from '@/auth/auth.controller';
import { Module } from '@nestjs/common';
import { UsersModule } from '@/users/users.module';
import { SessionStoreService } from '@/auth/session-store.service';
import { DiscordClientModule } from '@/discord-client/discord.client.module';

@Module({
    imports: [UsersModule, DiscordClientModule],
    providers: [AuthService, SessionStoreService],
    controllers: [AuthController],
    exports: [AuthService],
})
export class AuthModule {}
