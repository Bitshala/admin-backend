import {
    IsArray,
    IsDateString,
    IsEnum,
    IsNotEmpty,
    IsNumberString,
    IsOptional,
    IsString,
    ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CohortType } from '@/common/enum';

export class UpdateCohortRequestDto {
    @IsOptional()
    @IsDateString({ strict: true })
    startDate?: string;

    @IsOptional()
    @IsDateString({ strict: true })
    registrationDeadline?: string;
}

export class CreateCohortRequestDto {
    @IsEnum(CohortType)
    type!: CohortType;

    @IsDateString({ strict: true })
    startDate!: string;

    @IsDateString({ strict: true })
    registrationDeadline!: string;
}

export class QuestionDto {
    @IsString()
    @IsNotEmpty()
    text!: string;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    attachments?: string[];
}

export class UpdateCohortWeekRequestDto {
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => QuestionDto)
    questions?: QuestionDto[];

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => QuestionDto)
    bonusQuestion?: QuestionDto[];

    @IsOptional()
    @IsNumberString({
        no_symbols: true,
        locale: 'en-US',
    })
    @IsNotEmpty()
    classroomAssignmentId!: string | undefined;

    @IsOptional()
    @IsDateString({ strict: true })
    scheduledDate!: string | undefined;
}

export class JoinWaitlistRequestDto {
    @IsEnum(CohortType)
    type!: CohortType;
}
