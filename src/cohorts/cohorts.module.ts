import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cohort } from '@/entities/cohort.entity';
import { CohortWeek } from '@/entities/cohort-week.entity';
import { CohortsService } from '@/cohorts/cohorts.service';
import { CohortsController } from '@/cohorts/cohorts.controller';
import { DbTransactionModule } from '@/db-transaction/db-transaction.module';
import { DiscordClientModule } from '@/discord-client/discord.client.module';
import { CohortWaitlist } from '@/entities/cohort-waitlist.entity';
import { APITask } from '@/entities/api-task.entity';
import { User } from '@/entities/user.entity';
import { MailModule } from '@/mail/mail.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            APITask,
            Cohort,
            CohortWeek,
            CohortWaitlist,
            User,
        ]),
        DbTransactionModule,
        DiscordClientModule,
        MailModule,
    ],
    providers: [CohortsService],
    controllers: [CohortsController],
    exports: [CohortsService],
})
export class CohortsModule {}
