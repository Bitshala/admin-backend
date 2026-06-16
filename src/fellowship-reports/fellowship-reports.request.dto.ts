import {
    ArrayMaxSize,
    IsArray,
    IsEnum,
    IsInt,
    IsNotEmpty,
    IsOptional,
    IsString,
    IsUUID,
    Matches,
    Max,
    MaxLength,
    Min,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { PaginatedQueryDto } from '@/common/dto';
import {
    cleanLinks,
    MAX_LINKS,
} from '@/fellowship-applications/proposal-validation';
import {
    FellowshipReportStatus,
    FellowshipType,
    SortOrder,
} from '@/common/enum';

// Max length of a report summary, in characters. Mirrors the frontend's live
// limit so client and server counts agree.
export const SUMMARY_CHAR_LIMIT = 3500;

// A report link must be a GitHub pull-request or issue URL. Matches the
// frontend regex (case-insensitive); rejects bare repos, non-GitHub hosts,
// tree/commit paths and non-numeric IDs.
export const GITHUB_LINK_RE =
    /^https:\/\/github\.com\/[^/\s]+\/[^/\s]+\/(?:pull|issues)\/\d+(?:[#/?].*)?$/i;

const GITHUB_LINK_MESSAGE =
    'each link must be a valid GitHub pull-request or issue URL';

// Reflective free-text prompts shared by create and update. All optional and
// lenient everywhere (length-capped only) — they never gate submission.
export class ReportReflectionFieldsDto {
    // Q1: the month's most challenging or interesting piece of work.
    @IsOptional()
    @IsString()
    @MaxLength(SUMMARY_CHAR_LIMIT)
    challengingWork?: string;

    // Q2: something newly understood this month.
    @IsOptional()
    @IsString()
    @MaxLength(SUMMARY_CHAR_LIMIT)
    keyLearning?: string;

    // Q3: a piece of feedback from a maintainer or reviewer.
    @IsOptional()
    @IsString()
    @MaxLength(SUMMARY_CHAR_LIMIT)
    reviewerFeedback?: string;

    // Q4: what the fellow wants to get better at next month.
    @IsOptional()
    @IsString()
    @MaxLength(SUMMARY_CHAR_LIMIT)
    growthGoal?: string;
}

export class CreateFellowshipReportRequestDto extends ReportReflectionFieldsDto {
    @IsUUID()
    fellowshipId!: string;

    @IsInt()
    @Min(1)
    @Max(12)
    month!: number;

    @IsInt()
    @Min(2020)
    year!: number;

    // Lenient on draft writes: an empty/short summary is accepted; non-empty
    // is enforced only at submit (see service). Capped at SUMMARY_CHAR_LIMIT.
    @IsString()
    @MaxLength(SUMMARY_CHAR_LIMIT)
    summary!: string;

    @IsOptional()
    @Transform(({ value }) => cleanLinks(value))
    @IsArray()
    @ArrayMaxSize(MAX_LINKS)
    @Matches(GITHUB_LINK_RE, { each: true, message: GITHUB_LINK_MESSAGE })
    links?: string[];
}

export class UpdateFellowshipReportRequestDto extends ReportReflectionFieldsDto {
    @IsOptional()
    @IsString()
    @MaxLength(SUMMARY_CHAR_LIMIT)
    summary?: string;

    @IsOptional()
    @Transform(({ value }) => cleanLinks(value))
    @IsArray()
    @ArrayMaxSize(MAX_LINKS)
    @Matches(GITHUB_LINK_RE, { each: true, message: GITHUB_LINK_MESSAGE })
    links?: string[];
}

export class ReviewFellowshipReportRequestDto {
    @IsEnum(FellowshipReportStatus)
    status!: FellowshipReportStatus;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    reviewerRemarks?: string;
}

export enum FellowshipReportSortBy {
    CREATED_AT = 'createdAt',
    UPDATED_AT = 'updatedAt',
    /** Orders by reporting period (year, then month). */
    PERIOD = 'period',
}

export class ListFellowshipReportsQueryDto extends PaginatedQueryDto {
    /**
     * Defaults to all non-draft reports when omitted.
     */
    @IsOptional()
    @IsEnum(FellowshipReportStatus)
    status?: FellowshipReportStatus;

    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(12)
    @Type(() => Number)
    month?: number;

    @IsOptional()
    @IsInt()
    @Min(2020)
    @Type(() => Number)
    year?: number;

    /**
     * Filters by the type of the parent fellowship.
     */
    @IsOptional()
    @IsEnum(FellowshipType)
    type?: FellowshipType;

    /**
     * Restricts results to reports of a single fellowship.
     */
    @IsOptional()
    @IsUUID()
    fellowshipId?: string;

    /**
     * Case-insensitive substring match on the project name and the
     * fellow's name, Discord username/global name and email.
     */
    @IsOptional()
    @Transform(({ value }) =>
        typeof value === 'string' ? value.trim() : value,
    )
    @IsString()
    @MaxLength(100)
    search?: string;

    @IsOptional()
    @IsEnum(FellowshipReportSortBy)
    sortBy: FellowshipReportSortBy = FellowshipReportSortBy.CREATED_AT;

    @IsOptional()
    @IsEnum(SortOrder)
    sortOrder: SortOrder = SortOrder.DESC;
}
