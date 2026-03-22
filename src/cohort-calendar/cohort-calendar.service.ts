import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import ical, { ICalAlarmType, ICalCalendarMethod } from 'ical-generator';
import { Cohort } from '@/entities/cohort.entity';
import { CohortType, CohortWeekType } from '@/common/enum';
import { DISCORD_GENERAL_INVITE_URL } from '@/common/constants';

@Injectable()
export class CohortCalendarService {
    constructor(
        @InjectRepository(Cohort)
        private readonly cohortRepository: Repository<Cohort>,
    ) {}

    async generateCalendar(cohortId: string): Promise<string> {
        const cohort = await this.cohortRepository.findOne({
            where: { id: cohortId },
            relations: { weeks: true },
        });

        if (!cohort) {
            throw new NotFoundException(`Cohort ${cohortId} not found`);
        }

        const shortName = this.getCohortShortName(cohort.type);
        const season = cohort.season.toString().padStart(2, '0');
        const calendarName = `${shortName} S${season}`;

        const calendar = ical({
            name: calendarName,
            method: ICalCalendarMethod.PUBLISH,
            timezone: 'Asia/Kolkata',
            x: [
                ['X-WR-CALNAME', calendarName],
                ['REFRESH-INTERVAL', 'P1H'],
            ],
        });

        const sortedWeeks = [...cohort.weeks].sort((a, b) => a.week - b.week);

        for (const week of sortedWeeks) {
            const eventDate = new Date(cohort.startDate);
            eventDate.setUTCDate(eventDate.getUTCDate() + week.week * 7);
            eventDate.setUTCHours(14, 30, 0, 0);

            const endDate = new Date(eventDate);
            endDate.setUTCHours(15, 30, 0, 0);

            const { summary, description, location } = this.getEventDetails(
                week.type,
                week.week,
                calendarName,
                shortName,
            );

            const event = calendar.createEvent({
                id: `${week.id}@bitshala.org`,
                start: eventDate,
                end: endDate,
                summary,
                description,
                location,
                url: DISCORD_GENERAL_INVITE_URL,
                timezone: 'Asia/Kolkata',
            });

            event.createAlarm({
                type: ICalAlarmType.display,
                trigger: 60 * 60,
                description: `${summary} starts in 1 hour`,
            });

            event.createAlarm({
                type: ICalAlarmType.display,
                trigger: 24 * 60 * 60,
                description: `${summary} is tomorrow`,
            });
        }

        return calendar.toString();
    }

    private getEventDetails(
        type: CohortWeekType,
        weekNumber: number,
        calendarName: string,
        shortName: string,
    ): { summary: string; description: string; location: string } {
        switch (type) {
            case CohortWeekType.ORIENTATION:
                return {
                    summary: `Orientation - ${calendarName}`,
                    description: `Orientation session for ${calendarName}. Join the Bitshala Discord Lounge to get started.`,
                    location: 'Bitshala Discord Lounge',
                };
            case CohortWeekType.GROUP_DISCUSSION:
                return {
                    summary: `GD Session ${weekNumber} - ${calendarName}`,
                    description: `Group Discussion session ${weekNumber} for ${calendarName}. Join the ${shortName} channel on the Bitshala Discord server.`,
                    location: `${shortName} channel - Bitshala Discord`,
                };
            case CohortWeekType.GRADUATION:
                return {
                    summary: `Graduation - ${calendarName}`,
                    description: `Graduation session for ${calendarName}. Join the ${shortName} channel on the Bitshala Discord server.`,
                    location: `${shortName} channel - Bitshala Discord`,
                };
        }
    }

    private getCohortShortName(cohortType: CohortType): string {
        switch (cohortType) {
            case CohortType.MASTERING_BITCOIN:
                return 'MB';
            case CohortType.LEARNING_BITCOIN_FROM_COMMAND_LINE:
                return 'LBTCL';
            case CohortType.PROGRAMMING_BITCOIN:
                return 'PB';
            case CohortType.BITCOIN_PROTOCOL_DEVELOPMENT:
                return 'BPD';
            case CohortType.MASTERING_LIGHTNING_NETWORK:
                return 'LN';
        }
    }
}
