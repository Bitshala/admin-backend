import {
    IsEnum,
    IsInt,
    IsNotEmpty,
    IsOptional,
    IsString,
    IsUUID,
    Max,
    MaxLength,
    Min,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { PaginatedQueryDto } from '@/common/dto';
import {
    FellowshipReportStatus,
    FellowshipType,
    SortOrder,
} from '@/common/enum';

export class CreateFellowshipReportRequestDto {
    @IsUUID()
    fellowshipId!: string;

    @IsInt()
    @Min(1)
    @Max(12)
    month!: number;

    @IsInt()
    @Min(2020)
    year!: number;

    @IsString()
    @IsNotEmpty()
    content!: string;
}

export class UpdateFellowshipReportRequestDto {
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    content?: string;
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
