import { Controller, Get, Param, ParseUUIDPipe, Res } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { Public } from '@/auth/public-route.decorator';
import { CohortCalendarService } from '@/cohort-calendar/cohort-calendar.service';

@Controller('cohort-calendar')
@ApiTags('Cohort Calendar')
export class CohortCalendarController {
    constructor(
        private readonly cohortCalendarService: CohortCalendarService,
    ) {}

    @Get(':cohortId/subscribe')
    @Public()
    @ApiOperation({ summary: 'Subscribe to a cohort calendar (iCal)' })
    async subscribe(
        @Param('cohortId', new ParseUUIDPipe()) cohortId: string,
        @Res({ passthrough: true }) res: Response,
    ): Promise<string> {
        const ical = await this.cohortCalendarService.generateCalendar(
            cohortId,
        );
        res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
        return ical;
    }
}
