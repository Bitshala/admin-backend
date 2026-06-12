import {
    IsArray,
    IsDateString,
    IsEnum,
    IsInt,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsPositive,
    IsString,
    Max,
    MaxLength,
    Min,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { PaginatedQueryDto } from '@/common/dto';
import { FellowshipStatus, FellowshipType, SortOrder } from '@/common/enum';

export class CompleteFellowshipOnboardingDto {
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    mentorContact?: string;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    projectName?: string;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    projectGithubLink?: string;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    githubProfile?: string;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    location?: string;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    academicBackground?: string;

    @IsOptional()
    @IsInt()
    @Min(1900)
    graduationYear?: number;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    professionalExperience?: string;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    domains?: string[];

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    codingLanguages?: string[];

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    educationInterests?: string[];

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    bitcoinContributions?: string;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    bitcoinMotivation?: string;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    bitcoinOssGoal?: string;

    @IsOptional()
    @IsString()
    additionalInfo?: string;

    @IsOptional()
    @IsString()
    questionsForBitshala?: string;
}

export class StartFellowshipContractDto {
    @IsDateString({ strict: true })
    startDate!: string;

    /**
     * Duration of the fellowship in months. The contract end date is
     * derived from the start date and this period.
     */
    @IsInt()
    @Min(1)
    @Max(24)
    periodMonths!: number;

    @IsNumber({ maxDecimalPlaces: 2 })
    @IsPositive()
    @Max(5000)
    amountUsd!: number;
}

export enum FellowshipSortBy {
    CREATED_AT = 'createdAt',
    START_DATE = 'startDate',
    END_DATE = 'endDate',
    AMOUNT_USD = 'amountUsd',
}

export class ListFellowshipsQueryDto extends PaginatedQueryDto {
    @IsOptional()
    @IsEnum(FellowshipStatus)
    status?: FellowshipStatus;

    @IsOptional()
    @IsEnum(FellowshipType)
    type?: FellowshipType;

    /**
     * Case-insensitive substring match on project name, mentor contact,
     * GitHub profile, location and the fellow's name/Discord names/email.
     */
    @IsOptional()
    @Transform(({ value }) =>
        typeof value === 'string' ? value.trim() : value,
    )
    @IsString()
    @MaxLength(100)
    search?: string;

    @IsOptional()
    @IsEnum(FellowshipSortBy)
    sortBy: FellowshipSortBy = FellowshipSortBy.CREATED_AT;

    @IsOptional()
    @IsEnum(SortOrder)
    sortOrder: SortOrder = SortOrder.DESC;
}
