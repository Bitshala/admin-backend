import {
    IsArray,
    IsDateString,
    IsEmail,
    IsEnum,
    IsInt,
    IsNotEmpty,
    IsOptional,
    IsString,
    IsUUID,
    Max,
    Min,
} from 'class-validator';

export enum CalendarRole {
    READER = 'reader',
    WRITER = 'writer',
    OWNER = 'owner',
}

export class CreateCalendarRequestDto {
    @IsUUID()
    cohortId: string;

    @IsString()
    @IsNotEmpty()
    summary: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsString()
    timezone?: string;
}

export class ShareCalendarRequestDto {
    @IsEmail()
    email: string;

    @IsEnum(CalendarRole)
    role: CalendarRole;
}

export class CreateEventRequestDto {
    @IsString()
    @IsNotEmpty()
    summary: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsDateString()
    startDateTime: string;

    @IsDateString()
    endDateTime: string;

    @IsOptional()
    @IsArray()
    @IsEmail({}, { each: true })
    attendees?: string[];

    @IsOptional()
    @IsString()
    location?: string;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    recurrence?: string[];
}

export class UpdateEventRequestDto {
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    summary?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsDateString()
    startDateTime?: string;

    @IsOptional()
    @IsDateString()
    endDateTime?: string;

    @IsOptional()
    @IsArray()
    @IsEmail({}, { each: true })
    attendees?: string[];

    @IsOptional()
    @IsString()
    location?: string;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    recurrence?: string[];
}

export class ListEventsQueryDto {
    @IsOptional()
    @IsDateString()
    timeMin?: string;

    @IsOptional()
    @IsDateString()
    timeMax?: string;

    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(2500)
    maxResults?: number;
}
