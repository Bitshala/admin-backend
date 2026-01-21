import { ApiProperty } from '@nestjs/swagger';

export class CohortOptionDto {
    @ApiProperty({ description: 'Cohort UUID' })
    id: string;

    @ApiProperty({
        description: 'Cohort display name',
        example: 'Mastering Bitcoin S1',
    })
    name: string;

    @ApiProperty({ description: 'Cohort start date' })
    startDate: string;

    @ApiProperty({ description: 'Cohort end date' })
    endDate: string;

    @ApiProperty({ description: 'Whether a calendar exists for this cohort' })
    hasCalendar: boolean;

    constructor(obj: CohortOptionDto) {
        this.id = obj.id;
        this.name = obj.name;
        this.startDate = obj.startDate;
        this.endDate = obj.endDate;
        this.hasCalendar = obj.hasCalendar;
    }
}

export class ListCohortOptionsResponseDto {
    @ApiProperty({ type: [CohortOptionDto] })
    items: CohortOptionDto[];

    constructor(items: CohortOptionDto[]) {
        this.items = items;
    }
}

export class EventAttendeeResponseDto {
    email: string;
    responseStatus?: string;

    constructor(obj: EventAttendeeResponseDto) {
        this.email = obj.email;
        this.responseStatus = obj.responseStatus;
    }
}

export class EventResponseDto {
    id: string;
    summary: string | null;
    description: string | null;
    start: string | null;
    end: string | null;
    attendees: EventAttendeeResponseDto[];
    location: string | null;
    htmlLink: string | null;
    recurrence: string[] | null;

    constructor(obj: EventResponseDto) {
        this.id = obj.id;
        this.summary = obj.summary;
        this.description = obj.description;
        this.start = obj.start;
        this.end = obj.end;
        this.attendees = obj.attendees;
        this.location = obj.location;
        this.htmlLink = obj.htmlLink;
        this.recurrence = obj.recurrence;
    }
}

export class ListEventsResponseDto {
    items: EventResponseDto[];

    constructor(items: EventResponseDto[]) {
        this.items = items;
    }
}
