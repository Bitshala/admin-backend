import {
    IsEnum,
    IsInt,
    IsNotEmpty,
    IsOptional,
    IsString,
    IsUUID,
    Max,
    Min,
} from 'class-validator';
import { FellowshipReportStatus } from '@/common/enum';

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
