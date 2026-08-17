import { CohortType, CohortWeekType } from '@/common/enum';
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
    discordRoleAssigned!: boolean;
    teachingAssistant: TeachingAssistantInfo | null;

    constructor(partial: UsersWeekScoreResponseDto) {
        super(partial);
        Object.assign(this, partial);
    }

    static fromUserWithScore(
        user: User,
        weekId: string,
        discordRoleAssigned: boolean,
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
            discordRoleAssigned,
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
    displayName!: string;
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
    totalGroupDiscussionAttendance!: number;
    maxGroupDiscussionAttendance!: number;

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
        const totalGroupDiscussionAttendance = user.attendances.reduce(
            (acc, x) =>
                acc +
                (x.attended &&
                x.cohortWeek.type === CohortWeekType.GROUP_DISCUSSION
                    ? 1
                    : 0),
            0,
        );
        const maxGroupDiscussionAttendance = user.attendances.reduce(
            (acc, x) =>
                acc +
                (x.cohortWeek.type === CohortWeekType.GROUP_DISCUSSION ? 1 : 0),
            0,
        );

        return new LeaderboardEntryDto({
            userId: user.id,
            displayName: user.displayName,
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
            totalGroupDiscussionAttendance: totalGroupDiscussionAttendance,
            maxGroupDiscussionAttendance: maxGroupDiscussionAttendance,
        });
    }
}

/**
 * A leaderboard row as served to anonymous viewers: Discord handle, rank and
 * total score only.
 *
 * Deliberately a hand-written projection rather than an Omit<> of, or a spread
 * from, LeaderboardEntryDto — that DTO carries the member's real name, Discord
 * global name, user id, attendance counts and a per-component score breakdown.
 * Listing the four permitted fields explicitly means a field added there later
 * cannot surface here by default: leaking a new one has to be an act of
 * commission. The constructor copies field by field for the same reason.
 */
export class PublicLeaderboardEntryDto {
    rank!: number;
    discordUsername!: string;
    totalScore!: number;
    maxTotalScore!: number;

    constructor(obj: PublicLeaderboardEntryDto) {
        this.rank = obj.rank;
        this.discordUsername = obj.discordUsername;
        this.totalScore = obj.totalScore;
        this.maxTotalScore = obj.maxTotalScore;
    }
}

/**
 * A leaderboard row as served to students: the full score and attendance
 * breakdown, with member identity reduced to the Discord handle.
 *
 * Hand-written projection for the same reason as PublicLeaderboardEntryDto — and
 * here it is load-bearing rather than merely defensive. These rows are built
 * from a LeaderboardEntryDto, which carries the member's real name, so an
 * Object.assign or a spread would copy that straight through. Naming every field
 * is what keeps it out.
 *
 * userId is retained so the client can highlight the signed-in member's own row.
 */
export class StudentLeaderboardEntryDto {
    userId!: string;
    discordUsername!: string;
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
    totalGroupDiscussionAttendance!: number;
    maxGroupDiscussionAttendance!: number;

    constructor(obj: StudentLeaderboardEntryDto) {
        this.userId = obj.userId;
        this.discordUsername = obj.discordUsername;
        this.groupDiscussionTotalScore = obj.groupDiscussionTotalScore;
        this.groupDiscussionMaxTotalScore = obj.groupDiscussionMaxTotalScore;
        this.exerciseTotalScore = obj.exerciseTotalScore;
        this.exerciseMaxTotalScore = obj.exerciseMaxTotalScore;
        this.attendanceTotalScore = obj.attendanceTotalScore;
        this.attendanceMaxTotalScore = obj.attendanceMaxTotalScore;
        this.totalScore = obj.totalScore;
        this.maxTotalScore = obj.maxTotalScore;
        this.totalAttendance = obj.totalAttendance;
        this.maxAttendance = obj.maxAttendance;
        this.totalGroupDiscussionAttendance =
            obj.totalGroupDiscussionAttendance;
        this.maxGroupDiscussionAttendance = obj.maxGroupDiscussionAttendance;
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
    attendedWeeks!: number;
    totalWeeks!: number; // weeks with an attendance record (same set as weeklyScores)
    scorePercent!: number; // round(totalScore / maxTotalScore * 100), 0 if maxTotalScore is 0
    attendancePercent!: number; // round(attendedWeeks / totalWeeks * 100), 0 if totalWeeks is 0
    avgScore!: number; // totalScore / totalWeeks, 0 if totalWeeks is 0

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

export class CrossCohortPerformanceEntryDto {
    scoreReceived!: number;
    maxScore!: number;
    attendedWeeks!: number;
    totalWeeks!: number;

    constructor(partial: CrossCohortPerformanceEntryDto) {
        Object.assign(this, partial);
    }
}
