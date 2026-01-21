import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Calendar } from '@/entities/calendar.entity';
import { Cohort } from '@/entities/cohort.entity';
import { GoogleCalendarProvider } from '@/google/google-calendar.provider';
import { GoogleCalendarService } from '@/google-calendar/google-calendar.service';
import { GoogleCalendarController } from '@/google-calendar/google-calendar.controller';

@Module({
    imports: [TypeOrmModule.forFeature([Calendar, Cohort])],
    providers: [GoogleCalendarProvider, GoogleCalendarService],
    controllers: [GoogleCalendarController],
    exports: [GoogleCalendarService],
})
export class GoogleCalendarModule {}
