import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cohort } from '@/entities/cohort.entity';
import { CohortWeek } from '@/entities/cohort-week.entity';
import { CohortsService } from '@/cohorts/cohorts.service';
import { CohortsController } from '@/cohorts/cohorts.controller';
import { CohortsConfigService } from '@/cohorts/cohorts.config.service';
import { CohortReminderService } from '@/cohorts/cohort-reminder.service';
import { DbTransactionModule } from '@/db-transaction/db-transaction.module';
import { DiscordClientModule } from '@/discord-client/discord.client.module';
import { CohortWaitlist } from '@/entities/cohort-waitlist.entity';
import { User } from '@/entities/user.entity';
import { MailModule } from '@/mail/mail.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Cohort, CohortWeek, CohortWaitlist, User]),
        DbTransactionModule,
        DiscordClientModule,
        MailModule,
    ],
    providers: [CohortsConfigService, CohortsService, CohortReminderService],
    controllers: [CohortsController],
    exports: [CohortsService, CohortReminderService],
})
export class CohortsModule {}
