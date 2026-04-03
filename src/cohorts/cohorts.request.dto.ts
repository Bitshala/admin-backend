import {
    IsDateString,
    IsEnum,
    IsNotEmpty,
    IsNumberString,
    IsOptional,
    IsString,
} from 'class-validator';
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

export class UpdateCohortWeekRequestDto {
    @IsOptional()
    @IsString({ each: true })
    @IsNotEmpty({ each: true })
    questions!: string[] | undefined;

    @IsOptional()
    @IsString({ each: true })
    @IsNotEmpty({ each: true })
    bonusQuestion!: string[] | undefined;

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
