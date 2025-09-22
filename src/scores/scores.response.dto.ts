import { CohortType } from '@/common/enum';

export class GroupDiscussionScore {
    id: string;
    attendance: boolean;
    communicationScore: number;
    maxCommunicationScore: number;
    depthOfAnswerScore: number;
    maxDepthOfAnswerScore: number;
    technicalBitcoinFluencyScore: number;
    maxTechnicalBitcoinFluencyScore: number;
    engagementScore: number;
    maxEngagementScore: number;
    isBonusAttempted: boolean;
    bonusAnswerScore: number;
    maxBonusAnswerScore: number;
    bonusFollowupScore: number;
    maxBonusFollowupScore: number;
    totalScore: number;
    maxTotalScore: number;
    groupNumber?: number | null;

    constructor(partial: Partial<GroupDiscussionScore>) {
        Object.assign(this, partial);
    }
}

export class ExerciseScore {
    id: string;
    isSubmitted: boolean;
    isPassing: boolean;
    hasGoodDocumentation: boolean;
    hasGoodStructure: boolean;
    totalScore: number;
    maxTotalScore: number;

    constructor(partial: Partial<ExerciseScore>) {
        Object.assign(this, partial);
    }
}

export class WeeklyScore {
    weekId!: string;
    groupDiscussionScores!: GroupDiscussionScore;
    exerciseScores!: ExerciseScore;
    totalScore!: number;
    maxTotalScore!: number;

    constructor(partial: WeeklyScore) {
        Object.assign(this, partial);
    }
}

export class UsersWeekScoreResponseDto extends WeeklyScore {
    // User details
    userId!: string;
    discordUsername!: string;
    discordGlobalName!: string | null;
    name!: string | null;

    constructor(partial: UsersWeekScoreResponseDto) {
        super(partial);
        Object.assign(this, partial);
    }
}

export class ListScoresForCohortAndWeekResponseDto {
    scores!: UsersWeekScoreResponseDto[];

    constructor(partial: ListScoresForCohortAndWeekResponseDto) {
        Object.assign(this, partial);
    }
}

export class GetCohortScoresResponseDto {
    cohortId!: string;
    cohortType!: CohortType;
    seasonNumber!: number;
    weeklyScores!: WeeklyScore[];
    totalScore!: number;
    maxTotalScore!: number;

    constructor(partial: GetCohortScoresResponseDto) {
        Object.assign(this, partial);
    }
}

export class GetUsersScoresResponseDto {
    cohorts!: GetCohortScoresResponseDto[];
    totalScore!: number;
    maxTotalScore!: number;

    constructor(partial: GetUsersScoresResponseDto) {
        Object.assign(this, partial);
    }
}
