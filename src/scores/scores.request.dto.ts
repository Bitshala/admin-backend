import { IsBoolean, IsInt, IsOptional, IsUUID, Min } from 'class-validator';
import { IsValidScore } from '@/validators/is-valid-score';

export class UpdateScoresRequestDto {
    @IsBoolean()
    @IsOptional()
    attendance?: boolean;

    @IsOptional()
    @IsValidScore()
    communicationScore?: number;

    @IsOptional()
    @IsValidScore()
    depthOfAnswerScore?: number;

    @IsOptional()
    @IsValidScore()
    technicalBitcoinFluencyScore?: number;

    @IsOptional()
    @IsValidScore()
    engagementScore?: number;

    @IsBoolean()
    @IsOptional()
    isBonusAttempted?: boolean;

    @IsOptional()
    @IsValidScore()
    bonusAnswerScore?: number;

    @IsOptional()
    @IsValidScore()
    bonusFollowupScore?: number;

    @IsBoolean()
    @IsOptional()
    isSubmitted?: boolean;

    @IsBoolean()
    @IsOptional()
    isPassing?: boolean;

    @IsInt()
    @Min(0)
    @IsOptional()
    groupNumber?: number;

    @IsUUID()
    @IsOptional()
    teachingAssistantId?: string;
}

export class AssignGroupsRequestDto {
    @IsInt()
    @Min(1)
    participantsPerWeek: number;

    @IsInt()
    @Min(1)
    groupsAvailable: number;
}

export class AssignTAToGroupRequestDto {
    @IsUUID()
    userId: string;

    @IsInt()
    @Min(1)
    groupNumber: number;
}
