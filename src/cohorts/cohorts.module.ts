import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cohort } from '@/entities/cohort.entity';
import { CohortWeek } from '@/entities/cohort-week.entity';
import { CohortsService } from '@/cohorts/cohorts.service';
import { CohortsController } from '@/cohorts/cohorts.controller';
import { DbTransactionModule } from '@/db-transaction/db-transaction.module';
import { DiscordClientModule } from '@/discord-client/discord.client.module';
import { CohortWaitlist } from '@/entities/cohort-waitlist.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([Cohort, CohortWeek, CohortWaitlist]),
        DbTransactionModule,
        DiscordClientModule,
    ],
    providers: [CohortsService],
    controllers: [CohortsController],
    exports: [CohortsService],
})
export class CohortsModule {}
