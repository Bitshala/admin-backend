import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cohort } from '@/entities/cohort.entity';
import { CohortCalendarService } from '@/cohort-calendar/cohort-calendar.service';
import { CohortCalendarController } from '@/cohort-calendar/cohort-calendar.controller';

@Module({
    imports: [TypeOrmModule.forFeature([Cohort])],
    providers: [CohortCalendarService],
    controllers: [CohortCalendarController],
})
export class CohortCalendarModule {}
