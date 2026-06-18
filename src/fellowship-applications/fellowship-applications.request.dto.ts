import {
    ArrayMaxSize,
    IsArray,
    IsEnum,
    IsInt,
    IsNotEmpty,
    IsOptional,
    IsString,
    IsUrl,
    Matches,
    Max,
    MaxLength,
    Min,
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
    LINK_LIMIT,
    LONG_TEXT_LIMIT,
    MAX_GRADUATION_YEAR,
    MAX_TAGS,
    MIN_GRADUATION_YEAR,
    normalizeGithub,
    TAG_LIMIT,
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

    // mentorName, mentorContact, mentorTestimonial and projectName are required
    // at submit for developers and designers, but optional for educators (see
    // validateProposalForSubmit).
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

    @IsOptional()
    @Transform(trim)
    @IsString()
    @MaxLength(TITLE_LIMIT)
    projectName?: string;

    // Repository/project URL. Empty values are allowed on drafts; a non-empty
    // value must be a valid URL regardless of track.
    @Transform(trim)
    @ValidateIf(
        (o: ProposalFieldsDto) =>
            typeof o.projectGithubLink === 'string' &&
            o.projectGithubLink.length > 0,
    )
    @IsUrl({ require_protocol: true })
    @MaxLength(LINK_LIMIT)
    projectGithubLink?: string;

    @IsOptional()
    @Transform(trim)
    @IsString()
    @MaxLength(LONG_TEXT_LIMIT)
    academicBackground?: string;

    @IsOptional()
    @IsInt()
    @Min(MIN_GRADUATION_YEAR)
    @Max(MAX_GRADUATION_YEAR)
    graduationYear?: number;

    @IsOptional()
    @Transform(trim)
    @IsString()
    @MaxLength(LONG_TEXT_LIMIT)
    professionalExperience?: string;

    @IsOptional()
    @Transform(({ value }) => cleanLinks(value))
    @IsArray()
    @ArrayMaxSize(MAX_TAGS)
    @IsString({ each: true })
    @MaxLength(TAG_LIMIT, { each: true })
    domains?: string[];

    @IsOptional()
    @Transform(({ value }) => cleanLinks(value))
    @IsArray()
    @ArrayMaxSize(MAX_TAGS)
    @IsString({ each: true })
    @MaxLength(TAG_LIMIT, { each: true })
    codingLanguages?: string[];

    @IsOptional()
    @Transform(({ value }) => cleanLinks(value))
    @IsArray()
    @ArrayMaxSize(MAX_TAGS)
    @IsString({ each: true })
    @MaxLength(TAG_LIMIT, { each: true })
    educationInterests?: string[];

    @IsOptional()
    @Transform(trim)
    @IsString()
    @MaxLength(LONG_TEXT_LIMIT)
    bitcoinContributions?: string;

    @IsOptional()
    @Transform(trim)
    @IsString()
    @MaxLength(LONG_TEXT_LIMIT)
    bitcoinMotivation?: string;

    @IsOptional()
    @Transform(trim)
    @IsString()
    @MaxLength(LONG_TEXT_LIMIT)
    bitcoinOssGoal?: string;

    @IsOptional()
    @Transform(trim)
    @IsString()
    @MaxLength(LONG_TEXT_LIMIT)
    additionalInfo?: string;

    @IsOptional()
    @Transform(trim)
    @IsString()
    @MaxLength(LONG_TEXT_LIMIT)
    questionsForBitshala?: string;

    // Profile field: written through to the applicant's user profile rather
    // than stored on the application (see service), so it is never duplicated.
    // Limit mirrors UpdateUserRequest.location. Required at submit on all tracks.
    @IsOptional()
    @Transform(trim)
    @IsString()
    @MaxLength(255)
    location?: string;
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

    // Accepting an application is a multipart request that also carries the
    // Bitshala-signed unsigned-contract PDF (validated in the controller/service),
    // which replaces the old `driveFolderUrl` field.
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
