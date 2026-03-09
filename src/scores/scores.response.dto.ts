import { CohortType } from '@/common/enum';
import { User } from '@/entities/user.entity';
import { ServiceError } from '@/common/errors';
import { Attendance as AttendanceEntity } from '@/entities/attendance.entity';
import { GroupDiscussionScore as GroupDiscussionScoreEntity } from '@/entities/group-discussion-score.entity';
import { ExerciseScore as ExerciseScoreEntity } from '@/entities/exercise-score.entity';

export class GroupDiscussionScore {
    id: string;
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
    groupNumber: number | null;

    constructor(partial: Partial<GroupDiscussionScore>) {
        Object.assign(this, partial);
    }
}

export class ExerciseScore {
    id: string;
    isSubmitted: boolean;
    isPassing: boolean;
    totalScore: number;
    maxTotalScore: number;

    constructor(partial: Partial<ExerciseScore>) {
        Object.assign(this, partial);
    }
}

export class AttendanceScore {
    totalScore!: number;
    maxTotalScore!: number;
}

export class WeeklyScore {
    weekId!: string;
    attended!: boolean;
    groupDiscussionScores!: GroupDiscussionScore | null;
    exerciseScores!: ExerciseScore | null;
    attendanceScores!: AttendanceScore;
    totalScore!: number;
    maxTotalScore!: number;

    constructor(partial: WeeklyScore) {
        Object.assign(this, partial);
    }

    static fromScores(
        weekId: string,
        attendance: AttendanceEntity,
        groupDiscussionScore: GroupDiscussionScoreEntity | null,
        exerciseScore: ExerciseScoreEntity | null,
    ): WeeklyScore {
        return new WeeklyScore({
            weekId: weekId,
            attended: attendance.attended,
            groupDiscussionScores: groupDiscussionScore
                ? {
                      id: groupDiscussionScore.id,
                      communicationScore:
                          groupDiscussionScore.communicationScore,
                      maxCommunicationScore:
                          groupDiscussionScore.maxCommunicationScore,
                      depthOfAnswerScore:
                          groupDiscussionScore.depthOfAnswerScore,
                      maxDepthOfAnswerScore:
                          groupDiscussionScore.maxDepthOfAnswerScore,
                      technicalBitcoinFluencyScore:
                          groupDiscussionScore.technicalBitcoinFluencyScore,
                      maxTechnicalBitcoinFluencyScore:
                          groupDiscussionScore.maxTechnicalBitcoinFluencyScore,
                      engagementScore: groupDiscussionScore.engagementScore,
                      maxEngagementScore:
                          groupDiscussionScore.maxEngagementScore,
                      isBonusAttempted: groupDiscussionScore.isBonusAttempted,
                      bonusAnswerScore: groupDiscussionScore.bonusAnswerScore,
                      maxBonusAnswerScore:
                          groupDiscussionScore.maxBonusAnswerScore,
                      bonusFollowupScore:
                          groupDiscussionScore.bonusFollowupScore,
                      maxBonusFollowupScore:
                          groupDiscussionScore.maxBonusFollowupScore,
                      totalScore: groupDiscussionScore.scaledScore,
                      maxTotalScore: groupDiscussionScore.maxScaledScore,
                      groupNumber: groupDiscussionScore.groupNumber,
                  }
                : null,
            exerciseScores: exerciseScore
                ? {
                      id: exerciseScore.id,
                      isSubmitted: exerciseScore.isSubmitted,
                      isPassing: exerciseScore.isPassing,
                      totalScore: exerciseScore.scaledScore,
                      maxTotalScore: exerciseScore.maxScaledScore,
                  }
                : null,
            attendanceScores: {
                totalScore: attendance.scaledAttendanceScore,
                maxTotalScore: attendance.maxScaledAttendanceScore,
            },
            totalScore:
                (groupDiscussionScore?.scaledScore ?? 0) +
                attendance.scaledAttendanceScore +
                (exerciseScore?.scaledScore ?? 0),
            maxTotalScore:
                (groupDiscussionScore?.maxScaledScore ?? 0) +
                attendance.maxScaledAttendanceScore +
                (exerciseScore?.maxScaledScore ?? 0),
        });
    }
}

export class TeachingAssistantInfo {
    id: string;
    discordUserName: string;
    discordGlobalName: string | null;
    name: string | null;

    constructor(partial: Partial<TeachingAssistantInfo>) {
        Object.assign(this, partial);
    }

    static fromUserEntity(user: User): TeachingAssistantInfo {
        return new TeachingAssistantInfo({
            id: user.id,
            discordUserName: user.discordUserName,
            discordGlobalName: user.discordGlobalName,
            name: user.name,
        });
    }
}

export class UsersWeekScoreResponseDto extends WeeklyScore {
    // User details
    userId!: string;
    email!: string | null;
    discordUsername!: string;
    discordGlobalName!: string | null;
    name!: string | null;
    teachingAssistant: TeachingAssistantInfo | null;

    constructor(partial: UsersWeekScoreResponseDto) {
        super(partial);
        Object.assign(this, partial);
    }

    static fromUserWithScore(
        user: User,
        weekId: string,
    ): UsersWeekScoreResponseDto {
        if (!user.attendances || user.attendances.length === 0) {
            throw new ServiceError(`Missing attendances for user ${user.id}`);
        }

        if (
            user.attendances.length > 1 ||
            (user.groupDiscussionScores &&
                user.groupDiscussionScores.length > 1) ||
            (user.exerciseScores && user.exerciseScores.length > 1)
        ) {
            throw new ServiceError(`Multiple scores found for user ${user.id}`);
        }

        const attendance = user.attendances[0];
        const groupDiscussionScore = user.groupDiscussionScores
            ? user.groupDiscussionScores[0]
            : null;
        const exerciseScore = user.exerciseScores
            ? user.exerciseScores[0]
            : null;
        const assignedTA =
            groupDiscussionScore?.assignedTeachingAssistant ?? null;

        return new UsersWeekScoreResponseDto({
            userId: user.id,
            email: user.email,
            discordUsername: user.discordUserName,
            discordGlobalName: user.discordGlobalName,
            name: user.name,
            teachingAssistant: assignedTA
                ? TeachingAssistantInfo.fromUserEntity(assignedTA)
                : null,
            ...WeeklyScore.fromScores(
                weekId,
                attendance,
                groupDiscussionScore,
                exerciseScore,
            ),
        });
    }
}

export class LeaderboardEntryDto {
    userId!: string;
    discordUsername!: string;
    discordGlobalName!: string | null;
    name!: string | null;
    groupDiscussionTotalScore!: number;
    groupDiscussionMaxTotalScore!: number;
    exerciseTotalScore!: number;
    exerciseMaxTotalScore!: number;
    attendanceTotalScore!: number;
    attendanceMaxTotalScore!: number;
    totalScore!: number;
    maxTotalScore!: number;
    totalAttendance!: number;
    maxAttendance!: number;

    constructor(partial: LeaderboardEntryDto) {
        Object.assign(this, partial);
    }

    static fromUserWithScores(user: User): LeaderboardEntryDto {
        if (!user.attendances || user.attendances.length === 0) {
            throw new ServiceError(`Missing attendances for user ${user.id}`);
        }

        const groupDiscussionTotalScore =
            user.groupDiscussionScores?.reduce(
                (acc, x) => acc + x.scaledScore,
                0,
            ) ?? 0;
        const groupDiscussionMaxTotalScore =
            user.groupDiscussionScores?.reduce(
                (acc, x) => acc + x.maxScaledScore,
                0,
            ) ?? 0;
        const exerciseTotalScore =
            user.exerciseScores?.reduce((acc, x) => acc + x.scaledScore, 0) ??
            0;
        const exerciseMaxTotalScore =
            user.exerciseScores?.reduce(
                (acc, x) => acc + x.maxScaledScore,
                0,
            ) ?? 0;
        const attendanceTotalScore = user.attendances.reduce(
            (acc, x) => acc + x.scaledAttendanceScore,
            0,
        );
        const attendanceMaxTotalScore = user.attendances.reduce(
            (acc, x) => acc + x.maxScaledAttendanceScore,
            0,
        );
        const totalAttendance = user.attendances.reduce(
            (acc, x) => acc + (x.attended ? 1 : 0),
            0,
        );
        const maxAttendance = user.attendances.length;

        return new LeaderboardEntryDto({
            userId: user.id,
            discordUsername: user.discordUserName,
            discordGlobalName: user.discordGlobalName,
            name: user.name,
            groupDiscussionTotalScore: groupDiscussionTotalScore,
            groupDiscussionMaxTotalScore: groupDiscussionMaxTotalScore,
            exerciseTotalScore: exerciseTotalScore,
            exerciseMaxTotalScore: exerciseMaxTotalScore,
            attendanceTotalScore: attendanceTotalScore,
            attendanceMaxTotalScore: attendanceMaxTotalScore,
            totalScore:
                groupDiscussionTotalScore +
                attendanceTotalScore +
                exerciseTotalScore,
            maxTotalScore:
                groupDiscussionMaxTotalScore +
                attendanceMaxTotalScore +
                exerciseMaxTotalScore,
            totalAttendance: totalAttendance,
            maxAttendance: maxAttendance,
        });
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
