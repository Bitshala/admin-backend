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
import { Calendar } from '@/entities/calendar.entity';
import { Cohort } from '@/entities/cohort.entity';
import {
    CalendarRole,
    CreateCalendarRequestDto,
    CreateEventRequestDto,
    ListEventsQueryDto,
    ShareCalendarRequestDto,
    UpdateEventRequestDto,
} from '@/google-calendar/google-calendar.request.dto';
import {
    CalendarResponseDto,
    EventAttendeeResponseDto,
    EventResponseDto,
    ListEventsResponseDto,
} from '@/google-calendar/google-calendar.response.dto';
import { randomUUID } from 'crypto';

@Injectable()
export class GoogleCalendarService {
    private readonly logger = new Logger(GoogleCalendarService.name);

    constructor(
        @Inject('GOOGLE_CALENDAR')
        private readonly googleCalendar: calendar_v3.Calendar,
        @InjectRepository(Calendar)
        private readonly calendarRepository: Repository<Calendar>,
        @InjectRepository(Cohort)
        private readonly cohortRepository: Repository<Cohort>,
    ) {}

    async createCalendar(
        dto: CreateCalendarRequestDto,
    ): Promise<CalendarResponseDto> {
        const cohort = await this.cohortRepository.findOne({
            where: { id: dto.cohortId },
        });

        if (!cohort) {
            throw new BadRequestException(
                `Cohort with id ${dto.cohortId} does not exist.`,
            );
        }

        const existingCalendar = await this.calendarRepository.findOne({
            where: { cohortId: dto.cohortId, isActive: true },
        });

        if (existingCalendar) {
            throw new BadRequestException(
                `An active calendar already exists for cohort ${dto.cohortId}.`,
            );
        }

        const timezone = dto.timezone || 'UTC';

        const googleCalendarResponse =
            await this.googleCalendar.calendars.insert({
                requestBody: {
                    summary: dto.summary,
                    description: dto.description,
                    timeZone: timezone,
                },
            });

        const googleCalendarId = googleCalendarResponse.data.id;

        if (!googleCalendarId) {
            throw new Error('Failed to create Google Calendar');
        }

        const calendar = new Calendar();
        calendar.id = randomUUID();
        calendar.cohortId = dto.cohortId;
        calendar.googleCalendarId = googleCalendarId;
        calendar.summary = dto.summary;
        calendar.timezone = timezone;

        await this.calendarRepository.save(calendar);

        this.logger.log(
            `Created calendar ${calendar.id} for cohort ${dto.cohortId}`,
        );

        return new CalendarResponseDto({
            id: calendar.id,
            googleCalendarId: calendar.googleCalendarId,
            cohortId: calendar.cohortId,
            summary: calendar.summary || null,
            timezone: calendar.timezone || null,
            createdAt: calendar.createdAt.toISOString(),
            updatedAt: calendar.updatedAt.toISOString(),
        });
    }

    async getCalendar(calendarId: string): Promise<CalendarResponseDto> {
        const calendar = await this.calendarRepository.findOne({
            where: { id: calendarId, isActive: true },
        });

        if (!calendar) {
            throw new NotFoundException(
                `Calendar with id ${calendarId} not found.`,
            );
        }

        return new CalendarResponseDto({
            id: calendar.id,
            googleCalendarId: calendar.googleCalendarId,
            cohortId: calendar.cohortId,
            summary: calendar.summary || null,
            timezone: calendar.timezone || null,
            createdAt: calendar.createdAt.toISOString(),
            updatedAt: calendar.updatedAt.toISOString(),
        });
    }

    async deleteCalendar(calendarId: string): Promise<void> {
        const calendar = await this.calendarRepository.findOne({
            where: { id: calendarId, isActive: true },
        });

        if (!calendar) {
            throw new NotFoundException(
                `Calendar with id ${calendarId} not found.`,
            );
        }

        await this.googleCalendar.calendars.delete({
            calendarId: calendar.googleCalendarId,
        });

        await this.calendarRepository.softRemove(calendar);

        this.logger.log(`Deleted calendar ${calendarId}`);
    }

    async shareCalendar(
        calendarId: string,
        dto: ShareCalendarRequestDto,
    ): Promise<void> {
        const calendar = await this.calendarRepository.findOne({
            where: { id: calendarId, isActive: true },
        });

        if (!calendar) {
            throw new NotFoundException(
                `Calendar with id ${calendarId} not found.`,
            );
        }

        const roleMap: Record<CalendarRole, string> = {
            [CalendarRole.READER]: 'reader',
            [CalendarRole.WRITER]: 'writer',
            [CalendarRole.OWNER]: 'owner',
        };

        await this.googleCalendar.acl.insert({
            calendarId: calendar.googleCalendarId,
            requestBody: {
                role: roleMap[dto.role],
                scope: {
                    type: 'user',
                    value: dto.email,
                },
            },
        });

        this.logger.log(
            `Shared calendar ${calendarId} with ${dto.email} as ${dto.role}`,
        );
    }

    async createEvent(
        calendarId: string,
        dto: CreateEventRequestDto,
    ): Promise<EventResponseDto> {
        const calendar = await this.calendarRepository.findOne({
            where: { id: calendarId, isActive: true },
        });

        if (!calendar) {
            throw new NotFoundException(
                `Calendar with id ${calendarId} not found.`,
            );
        }

        const attendees = dto.attendees?.map((email) => ({ email }));

        const eventResponse = await this.googleCalendar.events.insert({
            calendarId: calendar.googleCalendarId,
            requestBody: {
                summary: dto.summary,
                description: dto.description,
                start: {
                    dateTime: dto.startDateTime,
                    timeZone: calendar.timezone || 'UTC',
                },
                end: {
                    dateTime: dto.endDateTime,
                    timeZone: calendar.timezone || 'UTC',
                },
                attendees,
                location: dto.location,
                recurrence: dto.recurrence,
            },
        });

        const event = eventResponse.data;

        this.logger.log(`Created event ${event.id} in calendar ${calendarId}`);

        return this.mapGoogleEventToDto(event);
    }

    async updateEvent(
        calendarId: string,
        eventId: string,
        dto: UpdateEventRequestDto,
    ): Promise<EventResponseDto> {
        const calendar = await this.calendarRepository.findOne({
            where: { id: calendarId, isActive: true },
        });

        if (!calendar) {
            throw new NotFoundException(
                `Calendar with id ${calendarId} not found.`,
            );
        }

        const existingEventResponse = await this.googleCalendar.events.get({
            calendarId: calendar.googleCalendarId,
            eventId,
        });

        const existingEvent = existingEventResponse.data;

        const attendees = dto.attendees?.map((email) => ({ email }));

        const eventResponse = await this.googleCalendar.events.patch({
            calendarId: calendar.googleCalendarId,
            eventId,
            requestBody: {
                summary: dto.summary ?? existingEvent.summary,
                description: dto.description ?? existingEvent.description,
                start: dto.startDateTime
                    ? {
                          dateTime: dto.startDateTime,
                          timeZone: calendar.timezone || 'UTC',
                      }
                    : existingEvent.start,
                end: dto.endDateTime
                    ? {
                          dateTime: dto.endDateTime,
                          timeZone: calendar.timezone || 'UTC',
                      }
                    : existingEvent.end,
                attendees: attendees ?? existingEvent.attendees,
                location: dto.location ?? existingEvent.location,
                recurrence: dto.recurrence ?? existingEvent.recurrence,
            },
        });

        const event = eventResponse.data;

        this.logger.log(`Updated event ${eventId} in calendar ${calendarId}`);

        return this.mapGoogleEventToDto(event);
    }

    async deleteEvent(calendarId: string, eventId: string): Promise<void> {
        const calendar = await this.calendarRepository.findOne({
            where: { id: calendarId, isActive: true },
        });

        if (!calendar) {
            throw new NotFoundException(
                `Calendar with id ${calendarId} not found.`,
            );
        }

        await this.googleCalendar.events.delete({
            calendarId: calendar.googleCalendarId,
            eventId,
        });

        this.logger.log(`Deleted event ${eventId} from calendar ${calendarId}`);
    }

    async listEvents(
        calendarId: string,
        query: ListEventsQueryDto,
    ): Promise<ListEventsResponseDto> {
        const calendar = await this.calendarRepository.findOne({
            where: { id: calendarId, isActive: true },
        });

        if (!calendar) {
            throw new NotFoundException(
                `Calendar with id ${calendarId} not found.`,
            );
        }

        const eventsResponse = await this.googleCalendar.events.list({
            calendarId: calendar.googleCalendarId,
            timeMin: query.timeMin,
            timeMax: query.timeMax,
            maxResults: query.maxResults || 250,
            singleEvents: true,
            orderBy: 'startTime',
        });

        const events = eventsResponse.data.items || [];

        return new ListEventsResponseDto(
            events.map((event) => this.mapGoogleEventToDto(event)),
        );
    }

    async getEvent(
        calendarId: string,
        eventId: string,
    ): Promise<EventResponseDto> {
        const calendar = await this.calendarRepository.findOne({
            where: { id: calendarId, isActive: true },
        });

        if (!calendar) {
            throw new NotFoundException(
                `Calendar with id ${calendarId} not found.`,
            );
        }

        const eventResponse = await this.googleCalendar.events.get({
            calendarId: calendar.googleCalendarId,
            eventId,
        });

        return this.mapGoogleEventToDto(eventResponse.data);
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
