import {
    IsArray,
    IsEnum,
    IsOptional,
    IsString,
    ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
    ComponentRating,
    OpportunityInterest,
    FellowshipInterest,
} from '@/common/enum';

export class ComponentRatingsDto {
    @IsOptional()
    @IsEnum(ComponentRating)
    sessionInstructions?: ComponentRating;

    @IsOptional()
    @IsEnum(ComponentRating)
    studyMaterial?: ComponentRating;

    @IsOptional()
    @IsEnum(ComponentRating)
    groupDiscussions?: ComponentRating;

    @IsOptional()
    @IsEnum(ComponentRating)
    loungeDiscussions?: ComponentRating;

    @IsOptional()
    @IsEnum(ComponentRating)
    deputy?: ComponentRating;

    @IsOptional()
    @IsEnum(ComponentRating)
    teachingAssistants?: ComponentRating;

    @IsOptional()
    @IsEnum(ComponentRating)
    bitshalaClubs?: ComponentRating;

    @IsOptional()
    @IsEnum(ComponentRating)
    bitdevMeetups?: ComponentRating;

    @IsOptional()
    @IsEnum(ComponentRating)
    bitspace?: ComponentRating;

    @IsOptional()
    @IsEnum(ComponentRating)
    fellowships?: ComponentRating;
}

export class CreateFeedbackRequestDto {
    @IsOptional()
    @ValidateNested()
    @Type(() => ComponentRatingsDto)
    componentRatings?: ComponentRatingsDto;

    @IsOptional()
    @IsString()
    expectations?: string;

    @IsOptional()
    @IsString()
    improvements?: string;

    @IsOptional()
    @IsArray()
    @IsEnum(OpportunityInterest, { each: true })
    opportunityInterests?: OpportunityInterest[];

    @IsOptional()
    @IsArray()
    @IsEnum(FellowshipInterest, { each: true })
    fellowshipInterests?: FellowshipInterest[];

    @IsOptional()
    @IsString()
    idealProject?: string;

    @IsOptional()
    @IsString()
    testimonial?: string;
}

export class UpdateFeedbackRequestDto {
    @IsOptional()
    @ValidateNested()
    @Type(() => ComponentRatingsDto)
    componentRatings?: ComponentRatingsDto;

    @IsOptional()
    @IsString()
    expectations?: string;

    @IsOptional()
    @IsString()
    improvements?: string;

    @IsOptional()
    @IsArray()
    @IsEnum(OpportunityInterest, { each: true })
    opportunityInterests?: OpportunityInterest[];

    @IsOptional()
    @IsArray()
    @IsEnum(FellowshipInterest, { each: true })
    fellowshipInterests?: FellowshipInterest[];

    @IsOptional()
    @IsString()
    idealProject?: string;

    @IsOptional()
    @IsString()
    testimonial?: string;
}
