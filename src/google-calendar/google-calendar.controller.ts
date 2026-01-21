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
import {
    ApiBearerAuth,
    ApiOperation,
    ApiParam,
    ApiTags,
} from '@nestjs/swagger';
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
    EventResponseDto,
    ListCohortOptionsResponseDto,
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

    @Get('cohorts')
    @ApiOperation({
        summary: 'List cohorts for calendar creation',
        description: 'Returns cohorts with their calendar status',
    })
    async listCohortOptions(): Promise<ListCohortOptionsResponseDto> {
        return this.googleCalendarService.listCohortOptions();
    }

    @Post()
    @ApiOperation({
        summary: 'Create a calendar for a cohort with recurring events',
    })
    async createCalendar(
        @Body() body: CreateCalendarRequestDto,
    ): Promise<void> {
        return this.googleCalendarService.createCalendar(body);
    }

    @Delete(':cohortId')
    @ApiOperation({ summary: 'Delete a cohort calendar' })
    @ApiParam({ name: 'cohortId', description: 'Cohort UUID' })
    async deleteCalendar(
        @Param('cohortId', new ParseUUIDPipe()) cohortId: string,
    ): Promise<void> {
        return this.googleCalendarService.deleteCalendar(cohortId);
    }

    @Post(':cohortId/share')
    @ApiOperation({ summary: 'Share calendar with a user' })
    @ApiParam({ name: 'cohortId', description: 'Cohort UUID' })
    async shareCalendar(
        @Param('cohortId', new ParseUUIDPipe()) cohortId: string,
        @Body() body: ShareCalendarRequestDto,
    ): Promise<void> {
        return this.googleCalendarService.shareCalendar(cohortId, body);
    }

    @Post(':cohortId/events')
    @ApiOperation({ summary: 'Create an event in a cohort calendar' })
    @ApiParam({ name: 'cohortId', description: 'Cohort UUID' })
    async createEvent(
        @Param('cohortId', new ParseUUIDPipe()) cohortId: string,
        @Body() body: CreateEventRequestDto,
    ): Promise<EventResponseDto> {
        return this.googleCalendarService.createEvent(cohortId, body);
    }

    @Get(':cohortId/events')
    @ApiOperation({ summary: 'List events in a cohort calendar' })
    @ApiParam({ name: 'cohortId', description: 'Cohort UUID' })
    async listEvents(
        @Param('cohortId', new ParseUUIDPipe()) cohortId: string,
        @Query() query: ListEventsQueryDto,
    ): Promise<ListEventsResponseDto> {
        return this.googleCalendarService.listEvents(cohortId, query);
    }

    @Patch(':cohortId/events/:eventId')
    @ApiOperation({ summary: 'Update an event' })
    @ApiParam({ name: 'cohortId', description: 'Cohort UUID' })
    async updateEvent(
        @Param('cohortId', new ParseUUIDPipe()) cohortId: string,
        @Param('eventId') eventId: string,
        @Body() body: UpdateEventRequestDto,
    ): Promise<EventResponseDto> {
        return this.googleCalendarService.updateEvent(cohortId, eventId, body);
    }

    @Delete(':cohortId/events/:eventId')
    @ApiOperation({ summary: 'Delete an event' })
    @ApiParam({ name: 'cohortId', description: 'Cohort UUID' })
    async deleteEvent(
        @Param('cohortId', new ParseUUIDPipe()) cohortId: string,
        @Param('eventId') eventId: string,
    ): Promise<void> {
        return this.googleCalendarService.deleteEvent(cohortId, eventId);
    }
}
