export class CalendarResponseDto {
    id: string;
    googleCalendarId: string;
    cohortId: string;
    summary: string | null;
    timezone: string | null;
    createdAt: string;
    updatedAt: string;

    constructor(obj: CalendarResponseDto) {
        this.id = obj.id;
        this.googleCalendarId = obj.googleCalendarId;
        this.cohortId = obj.cohortId;
        this.summary = obj.summary;
        this.timezone = obj.timezone;
        this.createdAt = obj.createdAt;
        this.updatedAt = obj.updatedAt;
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
