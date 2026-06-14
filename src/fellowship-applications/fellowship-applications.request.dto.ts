import {
    IsEnum,
    IsNotEmpty,
    IsOptional,
    IsString,
    IsUrl,
    Matches,
    MaxLength,
    ValidateIf,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { PaginatedQueryDto } from '@/common/dto';
import {
    FellowshipType,
    FellowshipApplicationStatus,
    SortOrder,
} from '@/common/enum';
import {
    cleanLinks,
    GITHUB_USERNAME_RE,
    IsLinkArray,
    LONG_TEXT_LIMIT,
    normalizeGithub,
    TITLE_LIMIT,
} from '@/fellowship-applications/proposal-validation';

const trim = ({ value }: { value: unknown }): unknown =>
    typeof value === 'string' ? value.trim() : value;

/**
 * Proposal fields shared by create and update. Every field is optional and only
 * its *upper bounds* are enforced here — this is what lets drafts auto-save with
 * partial/empty values. The full required/min-length ruleset is applied at
 * submit time in the service.
 */
export class ProposalFieldsDto {
    @IsOptional()
    @Transform(trim)
    @IsString()
    @MaxLength(TITLE_LIMIT)
    title?: string;

    @IsOptional()
    @Transform(trim)
    @IsString()
    @MaxLength(LONG_TEXT_LIMIT)
    problemStatement?: string;

    @IsOptional()
    @Transform(trim)
    @IsString()
    @MaxLength(LONG_TEXT_LIMIT)
    plan?: string;

    @IsOptional()
    @Transform(trim)
    @IsString()
    @MaxLength(TITLE_LIMIT)
    mentorName?: string;

    @IsOptional()
    @Transform(trim)
    @IsString()
    @MaxLength(TITLE_LIMIT)
    mentorContact?: string;

    @IsOptional()
    @Transform(trim)
    @IsString()
    @MaxLength(LONG_TEXT_LIMIT)
    mentorTestimonial?: string;

    // Accepts a bare handle, `@handle` or a github.com profile URL and stores
    // the bare username. Empty values are allowed on drafts; a non-empty but
    // malformed value is rejected regardless of track.
    @Transform(({ value }) =>
        typeof value === 'string' ? normalizeGithub(value) : value,
    )
    @ValidateIf(
        (o: ProposalFieldsDto) =>
            typeof o.github === 'string' && o.github.length > 0,
    )
    @IsString()
    @Matches(GITHUB_USERNAME_RE, {
        message:
            'github must be a valid GitHub username (1–39 chars; letters, digits or hyphens, starting with a letter or digit)',
    })
    github?: string;

    @IsOptional()
    @Transform(({ value }) => cleanLinks(value))
    @IsLinkArray()
    links?: string[];
}

export class CreateFellowshipApplicationRequestDto extends ProposalFieldsDto {
    @IsEnum(FellowshipType)
    type!: FellowshipType;
}

// `type` is immutable after create, so it is intentionally absent here.
export class UpdateFellowshipApplicationRequestDto extends ProposalFieldsDto {}

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
