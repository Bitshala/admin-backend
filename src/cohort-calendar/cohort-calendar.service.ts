import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import ical, { ICalAlarmType, ICalCalendarMethod } from 'ical-generator';
import { Cohort } from '@/entities/cohort.entity';
import { CohortWeekType } from '@/common/enum';
import { DISCORD_GENERAL_INVITE_URL } from '@/common/constants';
import { APITask } from '@/entities/api-task.entity';
import { TaskType } from '@/task-processor/task.enums';
import { MailService } from '@/mail/mail.service';
import { ServiceError } from '@/common/errors';

@Injectable()
export class CohortCalendarService {
    private readonly logger = new Logger(CohortCalendarService.name);

    constructor(
        @InjectRepository(Cohort)
        private readonly cohortRepository: Repository<Cohort>,
        private readonly mailService: MailService,
    ) {}

    async generateCalendar(cohortId: string): Promise<string> {
        const cohort = await this.findCohortWithWeeks(cohortId);
        return this.buildCalendar(cohort, ICalCalendarMethod.PUBLISH);
    }

    async generateCalendarInvite(cohortId: string): Promise<string> {
        const cohort = await this.findCohortWithWeeks(cohortId);
        return this.buildCalendar(cohort, ICalCalendarMethod.REQUEST);
    }

    async handleSendCalendarUpdateEmails(
        task: APITask<TaskType.SEND_CALENDAR_UPDATE_EMAILS>,
    ): Promise<void> {
        const { cohortId } = task.data;

        const cohort = await this.cohortRepository.findOne({
            where: { id: cohortId },
            relations: { users: true, weeks: true },
        });

        if (!cohort) {
            throw new ServiceError(
                `Cohort ${cohortId} not found for calendar update task`,
            );
        }

        const calendarInvite = this.buildCalendar(
            cohort,
            ICalCalendarMethod.REQUEST,
        );
        const cohortName = this.mailService.getCohortShortName(cohort.type);
        const season = `Season ${cohort.season.toString().padStart(2, '0')}`;

        this.logger.log(
            `Sending calendar update emails to ${cohort.users.length} users for cohort ${cohortId}`,
        );

        for (const user of cohort.users) {
            if (!user.email) {
                this.logger.warn(
                    `User ${user.id} does not have an email address, skipping calendar update email`,
                );
                continue;
            }

            try {
                await this.mailService.sendCalendarUpdateEmail(
                    user.email,
                    user.displayName,
                    cohortName,
                    season,
                    calendarInvite,
                );
            } catch (error) {
                this.logger.error(
                    `Failed to send calendar update email to user ${user.id}: ${error.message}`,
                    error.stack,
                );
            }
        }
    }

    private async findCohortWithWeeks(cohortId: string): Promise<Cohort> {
        const cohort = await this.cohortRepository.findOne({
            where: { id: cohortId },
            relations: { weeks: true },
        });

        if (!cohort) {
            throw new NotFoundException(`Cohort ${cohortId} not found`);
        }

        return cohort;
    }

    private buildCalendar(cohort: Cohort, method: ICalCalendarMethod): string {
        const shortName = this.mailService.getCohortShortName(cohort.type);
        const season = cohort.season.toString().padStart(2, '0');
        const calendarName = `${shortName} S${season}`;

        const calendar = ical({
            name: calendarName,
            method,
            timezone: 'Asia/Kolkata',
            x: [
                ['X-WR-CALNAME', calendarName],
                ['REFRESH-INTERVAL', 'P1H'],
            ],
        });

        const sortedWeeks = [...cohort.weeks].sort((a, b) => a.week - b.week);

        for (const week of sortedWeeks) {
            const eventDate = new Date(week.scheduledDate);
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
}
