import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cohort } from '@/entities/cohort.entity';
import { CohortCalendarService } from '@/cohort-calendar/cohort-calendar.service';
import { CohortCalendarController } from '@/cohort-calendar/cohort-calendar.controller';
import { MailModule } from '@/mail/mail.module';

@Module({
    imports: [TypeOrmModule.forFeature([Cohort]), MailModule],
    providers: [CohortCalendarService],
    controllers: [CohortCalendarController],
    exports: [CohortCalendarService],
})
export class CohortCalendarModule {}
