import {
    IsBoolean,
    IsDateString,
    IsEnum,
    IsInt,
    IsNotEmpty,
    IsOptional,
    IsString,
    Max,
    Min,
    ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CohortType } from '@/common/enum';

export class CohortWeekClassroomDataDto {
    @IsInt()
    @Min(0)
    week!: number;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    classroomUrl?: string;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    classroomInviteLink?: string;

    @IsOptional()
    @IsInt()
    classroomAssignmentId?: number;
}

export class UpdateCohortRequestDto {
    @IsOptional()
    @IsDateString({ strict: true })
    startDate?: string;

    @IsOptional()
    @IsDateString({ strict: true })
    endDate?: string;

    @IsOptional()
    @IsDateString({ strict: true })
    registrationDeadline?: string;

    @IsOptional()
    @ValidateNested({ each: true })
    @Type(() => CohortWeekClassroomDataDto)
    weekData?: CohortWeekClassroomDataDto[];
}

export class CreateCohortRequestDto {
    @IsEnum(CohortType)
    type!: CohortType;

    @IsInt()
    @Min(1)
    season!: number;

    @IsInt()
    @Min(1)
    @Max(8)
    weeks!: number;

    @IsDateString({ strict: true })
    startDate!: string;

    @IsDateString({ strict: true })
    endDate!: string;

    @IsDateString({ strict: true })
    registrationDeadline!: string;

    @IsBoolean()
    hasExercises!: boolean;

    @IsOptional()
    @ValidateNested({ each: true })
    @Type(() => CohortWeekClassroomDataDto)
    weekData?: CohortWeekClassroomDataDto[];
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

    @IsOptional()
    @IsInt()
    classroomAssignmentId!: number | undefined;
}

export class JoinWaitlistRequestDto {
    @IsEnum(CohortType)
    type!: CohortType;
}
