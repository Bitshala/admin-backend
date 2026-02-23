import {
    BadRequestException,
    Inject,
    Injectable,
    Logger,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { calendar_v3 } from 'googleapis';
import { Cohort } from '@/entities/cohort.entity';
import {
    CalendarRole,
    CreateCalendarRequestDto,
    CreateEventRequestDto,
    DayOfWeek,
    ListEventsQueryDto,
    ShareCalendarRequestDto,
    UpdateEventRequestDto,
} from '@/google-calendar/google-calendar.request.dto';
import {
    CohortOptionDto,
    EventAttendeeResponseDto,
    EventResponseDto,
    ListCohortOptionsResponseDto,
    ListEventsResponseDto,
} from '@/google-calendar/google-calendar.response.dto';
import { CohortType } from '@/common/enum';

@Injectable()
export class GoogleCalendarService {
    private readonly logger = new Logger(GoogleCalendarService.name);

    private readonly cohortTypeDisplayNames: Record<CohortType, string> = {
        [CohortType.MASTERING_BITCOIN]: 'Mastering Bitcoin',
        [CohortType.LEARNING_BITCOIN_FROM_COMMAND_LINE]:
            'Learning Bitcoin from Command Line',
        [CohortType.PROGRAMMING_BITCOIN]: 'Programming Bitcoin',
        [CohortType.BITCOIN_PROTOCOL_DEVELOPMENT]:
            'Bitcoin Protocol Development',
        [CohortType.MASTERING_LIGHTNING_NETWORK]: 'Mastering Lightning Network',
    };

    constructor(
        @Inject('GOOGLE_CALENDAR')
        private readonly googleCalendar: calendar_v3.Calendar,
        @InjectRepository(Cohort)
        private readonly cohortRepository: Repository<Cohort>,
    ) {}

    async listCohortOptions(): Promise<ListCohortOptionsResponseDto> {
        const cohorts = await this.cohortRepository.find({
            order: { startDate: 'DESC' },
        });

        const options = cohorts.map(
            (cohort) =>
                new CohortOptionDto({
                    id: cohort.id,
                    name: `${this.cohortTypeDisplayNames[cohort.type]} S${
                        cohort.season
                    }`,
                    startDate: cohort.startDate.toISOString(),
                    endDate: cohort.endDate.toISOString(),
                    hasCalendar: !!cohort.googleCalendarId,
                }),
        );

        return new ListCohortOptionsResponseDto(options);
    }

    async createCalendar(dto: CreateCalendarRequestDto): Promise<void> {
        const cohort = await this.cohortRepository.findOne({
            where: { id: dto.cohortId },
        });

        if (!cohort) {
            throw new BadRequestException(
                `Cohort with id ${dto.cohortId} does not exist.`,
            );
        }

        if (cohort.googleCalendarId) {
            throw new BadRequestException(
                `A calendar already exists for this cohort.`,
            );
        }

        const timezone = dto.timezone || 'UTC';
        const summary = `${this.cohortTypeDisplayNames[cohort.type]} S${
            cohort.season
        }`;
        const description = `Calendar for ${summary} cohort`;

        const googleCalendarResponse =
            await this.googleCalendar.calendars.insert({
                requestBody: {
                    summary,
                    description,
                    timeZone: timezone,
                },
            });

        const googleCalendarId = googleCalendarResponse.data.id;

        if (!googleCalendarId) {
            throw new Error('Failed to create Google Calendar');
        }

        cohort.googleCalendarId = googleCalendarId;
        await this.cohortRepository.save(cohort);

        // Create recurring weekly event
        const eventDuration = dto.eventDurationMinutes || 60;
        const [hours, minutes] = dto.eventTime.split(':').map(Number);

        const firstEventDate = this.getFirstOccurrence(
            cohort.startDate,
            dto.dayOfWeek,
        );

        const startDateTime = new Date(firstEventDate);
        startDateTime.setHours(hours, minutes, 0, 0);

        const endDateTime = new Date(startDateTime);
        endDateTime.setMinutes(endDateTime.getMinutes() + eventDuration);

        const untilDate = cohort.endDate
            .toISOString()
            .split('T')[0]
            .replace(/-/g, '');

        await this.googleCalendar.events.insert({
            calendarId: googleCalendarId,
            requestBody: {
                summary: `${summary} Session`,
                description: `Weekly session for ${summary}`,
                start: {
                    dateTime: startDateTime.toISOString(),
                    timeZone: timezone,
                },
                end: {
                    dateTime: endDateTime.toISOString(),
                    timeZone: timezone,
                },
                recurrence: [
                    `RRULE:FREQ=WEEKLY;BYDAY=${dto.dayOfWeek};UNTIL=${untilDate}`,
                ],
            },
        });

        this.logger.log(
            `Created calendar with recurring events for cohort ${dto.cohortId}`,
        );
    }

    async deleteCalendar(cohortId: string): Promise<void> {
        const cohort = await this.getCohortWithCalendar(cohortId);

        await this.googleCalendar.calendars.delete({
            calendarId: cohort.googleCalendarId!,
        });

        cohort.googleCalendarId = undefined;
        await this.cohortRepository.save(cohort);

        this.logger.log(`Deleted calendar for cohort ${cohortId}`);
    }

    async shareCalendar(
        cohortId: string,
        dto: ShareCalendarRequestDto,
    ): Promise<void> {
        const cohort = await this.getCohortWithCalendar(cohortId);

        const roleMap: Record<CalendarRole, string> = {
            [CalendarRole.READER]: 'reader',
            [CalendarRole.WRITER]: 'writer',
            [CalendarRole.OWNER]: 'owner',
        };

        await this.googleCalendar.acl.insert({
            calendarId: cohort.googleCalendarId!,
            requestBody: {
                role: roleMap[dto.role],
                scope: {
                    type: 'user',
                    value: dto.email,
                },
            },
        });

        this.logger.log(
            `Shared calendar for cohort ${cohortId} with ${dto.email} as ${dto.role}`,
        );
    }

    async createEvent(
        cohortId: string,
        dto: CreateEventRequestDto,
    ): Promise<EventResponseDto> {
        const cohort = await this.getCohortWithCalendar(cohortId);

        const attendees = dto.attendees?.map((email) => ({ email }));

        const eventResponse = await this.googleCalendar.events.insert({
            calendarId: cohort.googleCalendarId!,
            requestBody: {
                summary: dto.summary,
                description: dto.description,
                start: {
                    dateTime: dto.startDateTime,
                    timeZone: 'UTC',
                },
                end: {
                    dateTime: dto.endDateTime,
                    timeZone: 'UTC',
                },
                attendees,
                location: dto.location,
                recurrence: dto.recurrence,
            },
        });

        const event = eventResponse.data;

        this.logger.log(
            `Created event ${event.id} in calendar for cohort ${cohortId}`,
        );

        return this.mapGoogleEventToDto(event);
    }

    async updateEvent(
        cohortId: string,
        eventId: string,
        dto: UpdateEventRequestDto,
    ): Promise<EventResponseDto> {
        const cohort = await this.getCohortWithCalendar(cohortId);

        const existingEventResponse = await this.googleCalendar.events.get({
            calendarId: cohort.googleCalendarId!,
            eventId,
        });

        const existingEvent = existingEventResponse.data;

        const attendees = dto.attendees?.map((email) => ({ email }));

        const eventResponse = await this.googleCalendar.events.patch({
            calendarId: cohort.googleCalendarId!,
            eventId,
            requestBody: {
                summary: dto.summary ?? existingEvent.summary,
                description: dto.description ?? existingEvent.description,
                start: dto.startDateTime
                    ? { dateTime: dto.startDateTime, timeZone: 'UTC' }
                    : existingEvent.start,
                end: dto.endDateTime
                    ? { dateTime: dto.endDateTime, timeZone: 'UTC' }
                    : existingEvent.end,
                attendees: attendees ?? existingEvent.attendees,
                location: dto.location ?? existingEvent.location,
                recurrence: dto.recurrence ?? existingEvent.recurrence,
            },
        });

        const event = eventResponse.data;

        this.logger.log(
            `Updated event ${eventId} in calendar for cohort ${cohortId}`,
        );

        return this.mapGoogleEventToDto(event);
    }

    async deleteEvent(cohortId: string, eventId: string): Promise<void> {
        const cohort = await this.getCohortWithCalendar(cohortId);

        await this.googleCalendar.events.delete({
            calendarId: cohort.googleCalendarId!,
            eventId,
        });

        this.logger.log(
            `Deleted event ${eventId} from calendar for cohort ${cohortId}`,
        );
    }

    async listEvents(
        cohortId: string,
        query: ListEventsQueryDto,
    ): Promise<ListEventsResponseDto> {
        const cohort = await this.getCohortWithCalendar(cohortId);

        const eventsResponse = await this.googleCalendar.events.list({
            calendarId: cohort.googleCalendarId!,
            timeMin: query.timeMin,
            timeMax: query.timeMax,
            singleEvents: true,
            orderBy: 'startTime',
        });

        const events = eventsResponse.data.items || [];

        return new ListEventsResponseDto(
            events.map((event) => this.mapGoogleEventToDto(event)),
        );
    }

    private async getCohortWithCalendar(cohortId: string): Promise<Cohort> {
        const cohort = await this.cohortRepository.findOne({
            where: { id: cohortId },
        });

        if (!cohort) {
            throw new NotFoundException(
                `Cohort with id ${cohortId} not found.`,
            );
        }

        if (!cohort.googleCalendarId) {
            throw new BadRequestException(
                `No calendar exists for cohort ${cohortId}. Create one first.`,
            );
        }

        return cohort;
    }

    private getFirstOccurrence(startDate: Date, dayOfWeek: DayOfWeek): Date {
        const dayMap: Record<DayOfWeek, number> = {
            [DayOfWeek.SUNDAY]: 0,
            [DayOfWeek.MONDAY]: 1,
            [DayOfWeek.TUESDAY]: 2,
            [DayOfWeek.WEDNESDAY]: 3,
            [DayOfWeek.THURSDAY]: 4,
            [DayOfWeek.FRIDAY]: 5,
            [DayOfWeek.SATURDAY]: 6,
        };

        const targetDay = dayMap[dayOfWeek];
        const date = new Date(startDate);
        const currentDay = date.getDay();

        let daysToAdd = targetDay - currentDay;
        if (daysToAdd < 0) {
            daysToAdd += 7;
        }

        date.setDate(date.getDate() + daysToAdd);
        return date;
    }

    private mapGoogleEventToDto(
        event: calendar_v3.Schema$Event,
    ): EventResponseDto {
        const attendees: EventAttendeeResponseDto[] =
            event.attendees?.map(
                (a) =>
                    new EventAttendeeResponseDto({
                        email: a.email || '',
                        responseStatus: a.responseStatus ?? undefined,
                    }),
            ) || [];

        return new EventResponseDto({
            id: event.id || '',
            summary: event.summary || null,
            description: event.description || null,
            start: event.start?.dateTime || event.start?.date || null,
            end: event.end?.dateTime || event.end?.date || null,
            attendees,
            location: event.location || null,
            htmlLink: event.htmlLink || null,
            recurrence: event.recurrence || null,
        });
    }
}
