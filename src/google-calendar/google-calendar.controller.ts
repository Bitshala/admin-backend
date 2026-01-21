import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseUUIDPipe,
    Patch,
    Post,
    Query,
    UsePipes,
    ValidationPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '@/auth/roles.decorator';
import { UserRole } from '@/common/enum';
import { GoogleCalendarService } from '@/google-calendar/google-calendar.service';
import {
    CreateCalendarRequestDto,
    CreateEventRequestDto,
    ListEventsQueryDto,
    ShareCalendarRequestDto,
    UpdateEventRequestDto,
} from '@/google-calendar/google-calendar.request.dto';
import {
    CalendarResponseDto,
    EventResponseDto,
    ListEventsResponseDto,
} from '@/google-calendar/google-calendar.response.dto';

@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@ApiTags('Calendars')
@ApiBearerAuth()
@Controller('calendars')
@Roles(UserRole.TEACHING_ASSISTANT, UserRole.ADMIN)
export class GoogleCalendarController {
    constructor(
        private readonly googleCalendarService: GoogleCalendarService,
    ) {}

    @Post()
    @ApiOperation({ summary: 'Create a calendar for a cohort' })
    async createCalendar(
        @Body() body: CreateCalendarRequestDto,
    ): Promise<CalendarResponseDto> {
        return this.googleCalendarService.createCalendar(body);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get calendar details' })
    async getCalendar(
        @Param('id', new ParseUUIDPipe()) id: string,
    ): Promise<CalendarResponseDto> {
        return this.googleCalendarService.getCalendar(id);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a calendar' })
    async deleteCalendar(
        @Param('id', new ParseUUIDPipe()) id: string,
    ): Promise<void> {
        return this.googleCalendarService.deleteCalendar(id);
    }

    @Post(':id/share')
    @ApiOperation({ summary: 'Share calendar with a user' })
    async shareCalendar(
        @Param('id', new ParseUUIDPipe()) id: string,
        @Body() body: ShareCalendarRequestDto,
    ): Promise<void> {
        return this.googleCalendarService.shareCalendar(id, body);
    }

    @Post(':id/events')
    @ApiOperation({ summary: 'Create an event in a calendar' })
    async createEvent(
        @Param('id', new ParseUUIDPipe()) id: string,
        @Body() body: CreateEventRequestDto,
    ): Promise<EventResponseDto> {
        return this.googleCalendarService.createEvent(id, body);
    }

    @Get(':id/events')
    @ApiOperation({ summary: 'List events in a calendar' })
    async listEvents(
        @Param('id', new ParseUUIDPipe()) id: string,
        @Query() query: ListEventsQueryDto,
    ): Promise<ListEventsResponseDto> {
        return this.googleCalendarService.listEvents(id, query);
    }

    @Get(':id/events/:eventId')
    @ApiOperation({ summary: 'Get a single event' })
    async getEvent(
        @Param('id', new ParseUUIDPipe()) id: string,
        @Param('eventId') eventId: string,
    ): Promise<EventResponseDto> {
        return this.googleCalendarService.getEvent(id, eventId);
    }

    @Patch(':id/events/:eventId')
    @ApiOperation({ summary: 'Update an event' })
    async updateEvent(
        @Param('id', new ParseUUIDPipe()) id: string,
        @Param('eventId') eventId: string,
        @Body() body: UpdateEventRequestDto,
    ): Promise<EventResponseDto> {
        return this.googleCalendarService.updateEvent(id, eventId, body);
    }

    @Delete(':id/events/:eventId')
    @ApiOperation({ summary: 'Delete an event' })
    async deleteEvent(
        @Param('id', new ParseUUIDPipe()) id: string,
        @Param('eventId') eventId: string,
    ): Promise<void> {
        return this.googleCalendarService.deleteEvent(id, eventId);
    }
}
