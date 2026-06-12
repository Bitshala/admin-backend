import {
    IsEnum,
    IsNotEmpty,
    IsOptional,
    IsString,
    IsUrl,
    Matches,
    MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { PaginatedQueryDto } from '@/common/dto';
import {
    FellowshipType,
    FellowshipApplicationStatus,
    SortOrder,
} from '@/common/enum';

// The client caps the two long-form sections at 3,000 chars each; this bound
// covers both plus title, links and markdown framing with generous headroom.
const PROPOSAL_MAX_LENGTH = 20_000;

export class CreateFellowshipApplicationRequestDto {
    @IsEnum(FellowshipType)
    type!: FellowshipType;

    @IsString()
    @IsNotEmpty()
    @MaxLength(PROPOSAL_MAX_LENGTH)
    proposal!: string;
}

export class UpdateFellowshipApplicationRequestDto {
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    @MaxLength(PROPOSAL_MAX_LENGTH)
    proposal?: string;
}

export class ReviewFellowshipApplicationRequestDto {
    @IsEnum(FellowshipApplicationStatus)
    status!: FellowshipApplicationStatus;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    reviewerRemarks?: string;

    // Required when status === ACCEPTED (enforced in the service).
    // Folder hosts the unsigned contract and is where the fellow uploads
    // their W-8BEN form — so it must be an actual Drive folder URL, not
    // just any drive.google.com link.
    @IsOptional()
    @IsUrl()
    @Matches(
        /^https:\/\/drive\.google\.com\/drive\/(u\/\d+\/)?folders\/[\w-]+([?#].*)?$/,
        {
            message:
                'driveFolderUrl must be a Google Drive folder URL (https://drive.google.com/drive/folders/…)',
        },
    )
    driveFolderUrl?: string;
}

export enum FellowshipApplicationSortBy {
    CREATED_AT = 'createdAt',
    UPDATED_AT = 'updatedAt',
}

export class ListFellowshipApplicationsQueryDto extends PaginatedQueryDto {
    /**
     * Defaults to all non-draft applications when omitted.
     */
    @IsOptional()
    @IsEnum(FellowshipApplicationStatus)
    status?: FellowshipApplicationStatus;

    @IsOptional()
    @IsEnum(FellowshipType)
    type?: FellowshipType;

    /**
     * Case-insensitive substring match on the applicant's name, Discord
     * username/global name and email.
     */
    @IsOptional()
    @Transform(({ value }) =>
        typeof value === 'string' ? value.trim() : value,
    )
    @IsString()
    @MaxLength(100)
    search?: string;

    @IsOptional()
    @IsEnum(FellowshipApplicationSortBy)
    sortBy: FellowshipApplicationSortBy =
        FellowshipApplicationSortBy.CREATED_AT;

    @IsOptional()
    @IsEnum(SortOrder)
    sortOrder: SortOrder = SortOrder.DESC;
}
