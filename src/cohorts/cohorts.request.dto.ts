import {
    IsDateString,
    IsEnum,
    IsNotEmpty,
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
    @IsString()
    @IsNotEmpty()
    classroomUrl!: string | undefined;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    classroomInviteLink!: string | undefined;
}

export class JoinWaitlistRequestDto {
    @IsEnum(CohortType)
    type!: CohortType;
}
