import { Global, Module } from '@nestjs/common';
import { DiscordAlertService } from '@/common/discord-alert.service';

@Global()
@Module({
    providers: [DiscordAlertService],
    exports: [DiscordAlertService],
})
export class MonitoringModule {}
