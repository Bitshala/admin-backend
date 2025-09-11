import { IsBoolean, IsOptional } from 'class-validator';
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

    @IsBoolean()
    @IsOptional()
    hasGoodDocumentation?: boolean;

    @IsBoolean()
    @IsOptional()
    hasGoodStructure?: boolean;
}
