import { ApiProperty } from '@nestjs/swagger';
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
    Matches,
    Max,
    Min,
} from 'class-validator';

export enum CalendarRole {
    READER = 'reader',
    WRITER = 'writer',
    OWNER = 'owner',
}

export enum DayOfWeek {
    SUNDAY = 'SU',
    MONDAY = 'MO',
    TUESDAY = 'TU',
    WEDNESDAY = 'WE',
    THURSDAY = 'TH',
    FRIDAY = 'FR',
    SATURDAY = 'SA',
}

export class CreateCalendarRequestDto {
    @ApiProperty({
        description: 'Select a cohort from the dropdown',
        example: 'uuid-here',
    })
    @IsUUID()
    cohortId: string;

    @ApiProperty({
        description: 'Time of day for the recurring event (24-hour format)',
        example: '18:00',
    })
    @IsString()
    @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
        message: 'Time must be in HH:mm format (24-hour)',
    })
    eventTime: string;

    @ApiProperty({
        description: 'Day of week for the recurring event',
        enum: DayOfWeek,
        example: DayOfWeek.MONDAY,
    })
    @IsEnum(DayOfWeek)
    dayOfWeek: DayOfWeek;

    @ApiProperty({
        description: 'Duration of each event in minutes',
        example: 60,
        default: 60,
        required: false,
    })
    @IsOptional()
    @IsInt()
    @Min(15)
    @Max(480)
    eventDurationMinutes?: number;

    @ApiProperty({
        description: 'Timezone for the calendar',
        example: 'America/New_York',
        default: 'UTC',
        required: false,
    })
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
}
