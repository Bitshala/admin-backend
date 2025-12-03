import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { GroupDiscussionScore } from '@/entities/group-discussion-score.entity';
import { Repository } from 'typeorm';
import { ExerciseScore } from '@/entities/exercise-score.entity';
import { User } from '@/entities/user.entity';
import {
    GetCohortScoresResponseDto,
    GetUsersScoresResponseDto,
    ListScoresForCohortAndWeekResponseDto,
    TeachingAssistantInfo,
    UsersWeekScoreResponseDto,
    WeeklyScore,
} from '@/scores/scores.response.dto';
import { ServiceError } from '@/common/errors';
import {
    AssignGroupsRequestDto,
    UpdateScoresRequestDto,
} from '@/scores/scores.request.dto';
import { Cohort } from '@/entities/cohort.entity';
import { CohortWeek } from '@/entities/cohort-week.entity';

@Injectable()
export class ScoresService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        @InjectRepository(Cohort)
        private readonly cohortRepository: Repository<Cohort>,
        @InjectRepository(CohortWeek)
        private readonly cohortWeekRepository: Repository<CohortWeek>,
        @InjectRepository(GroupDiscussionScore)
        private readonly groupDiscussionScoreRepository: Repository<GroupDiscussionScore>,
        @InjectRepository(ExerciseScore)
        private readonly exerciseScoreRepository: Repository<ExerciseScore>,
    ) {}

    private userWithScoreToUsersScoreDto(
        user: User,
        weekId: string,
    ): UsersWeekScoreResponseDto {
        if (
            !user.groupDiscussionScores ||
            !user.exerciseScores ||
            user.groupDiscussionScores.length === 0 ||
            user.exerciseScores.length === 0
        ) {
            throw new ServiceError(`Missing scores for user ${user.id}`);
        }

        if (
            user.groupDiscussionScores.length > 1 ||
            user.exerciseScores.length > 1
        ) {
            throw new ServiceError(`Multiple scores found for user ${user.id}`);
        }

        const groupDiscussionScore = user.groupDiscussionScores[0];
        const exerciseScore = user.exerciseScores[0];
        const assignedTA = groupDiscussionScore.assignedTeachingAssistant;

        return new UsersWeekScoreResponseDto({
            userId: user.id,
            discordUsername: user.discordUserName,
            discordGlobalName: user.discordGlobalName,
            name: user.name,
            weekId: weekId,
            teachingAssistant: assignedTA
                ? TeachingAssistantInfo.fromUserEntity(assignedTA)
                : null,
            groupDiscussionScores: {
                id: groupDiscussionScore.id,
                attendance: groupDiscussionScore.attendance,
                communicationScore: groupDiscussionScore.communicationScore,
                maxCommunicationScore:
                    groupDiscussionScore.maxCommunicationScore,
                depthOfAnswerScore: groupDiscussionScore.depthOfAnswerScore,
                maxDepthOfAnswerScore:
                    groupDiscussionScore.maxDepthOfAnswerScore,
                technicalBitcoinFluencyScore:
                    groupDiscussionScore.technicalBitcoinFluencyScore,
                maxTechnicalBitcoinFluencyScore:
                    groupDiscussionScore.maxTechnicalBitcoinFluencyScore,
                engagementScore: groupDiscussionScore.engagementScore,
                maxEngagementScore: groupDiscussionScore.maxEngagementScore,
                isBonusAttempted: groupDiscussionScore.isBonusAttempted,
                bonusAnswerScore: groupDiscussionScore.bonusAnswerScore,
                maxBonusAnswerScore: groupDiscussionScore.maxBonusAnswerScore,
                bonusFollowupScore: groupDiscussionScore.bonusFollowupScore,
                maxBonusFollowupScore:
                    groupDiscussionScore.maxBonusFollowupScore,
                totalScore: groupDiscussionScore.totalScore,
                maxTotalScore: groupDiscussionScore.maxScore,
                groupNumber: groupDiscussionScore.groupNumber,
            },
            exerciseScores: {
                id: exerciseScore.id,
                isSubmitted: exerciseScore.isSubmitted,
                isPassing: exerciseScore.isPassing,
                hasGoodDocumentation: exerciseScore.hasGoodDocumentation,
                hasGoodStructure: exerciseScore.hasGoodStructure,
                totalScore: exerciseScore.totalScore,
                maxTotalScore: exerciseScore.maxScore,
            },
            totalScore:
                groupDiscussionScore.totalScore + exerciseScore.totalScore,
            maxTotalScore:
                groupDiscussionScore.maxScore + exerciseScore.maxScore,
        });
    }

    async listScoresForCohortAndWeek(
        cohortId: string,
        cohortWeekId: string,
    ): Promise<ListScoresForCohortAndWeekResponseDto> {
        const usersWithScores = await this.userRepository.find({
            where: {
                groupDiscussionScores: {
                    cohort: { id: cohortId },
                    cohortWeek: { id: cohortWeekId },
                },
                exerciseScores: {
                    cohort: { id: cohortId },
                    cohortWeek: { id: cohortWeekId },
                },
            },
            relations: {
                groupDiscussionScores: {
                    assignedTeachingAssistant: true,
                },
                exerciseScores: true,
            },
        });

        return new ListScoresForCohortAndWeekResponseDto({
            scores: usersWithScores
                .map<UsersWeekScoreResponseDto>(
                    (u) => this.userWithScoreToUsersScoreDto(u, cohortWeekId),
                    this,
                )
                .sort((a, b) => {
                    if (
                        a.groupDiscussionScores.groupNumber !== null &&
                        b.groupDiscussionScores.groupNumber !== null &&
                        a.groupDiscussionScores.groupNumber !==
                            b.groupDiscussionScores.groupNumber
                    ) {
                        return (
                            a.groupDiscussionScores.groupNumber -
                            b.groupDiscussionScores.groupNumber
                        );
                    }

                    return a.userId.localeCompare(b.userId);
                }),
        });
    }

    async updateScoresForUserCohortAndWeek(
        userId: string,
        cohortId: string,
        weekId: string,
        body: UpdateScoresRequestDto,
    ): Promise<void> {
        const user = await this.userRepository.findOne({
            where: { id: userId },
            relations: {
                groupDiscussionScores: {
                    cohort: true,
                    cohortWeek: true,
                },
                exerciseScores: {
                    cohort: true,
                    cohortWeek: true,
                },
            },
        });

        if (!user) {
            throw new ServiceError(`User with id ${userId} not found`);
        }

        const groupDiscussionScore = user.groupDiscussionScores.find(
            (score) =>
                score.cohort.id === cohortId && score.cohortWeek.id === weekId,
        );

        if (!groupDiscussionScore) {
            throw new ServiceError(
                `Group discussion score for user ${userId} in cohort ${cohortId} and week ${weekId} not found`,
            );
        }

        const exerciseScore = user.exerciseScores.find(
            (score) =>
                score.cohort.id === cohortId && score.cohortWeek.id === weekId,
        );

        if (!exerciseScore) {
            throw new ServiceError(
                `Exercise score for user ${userId} in cohort ${cohortId} and week ${weekId} not found`,
            );
        }

        if (body.attendance !== undefined)
            groupDiscussionScore.attendance = body.attendance;
        if (body.communicationScore !== undefined)
            groupDiscussionScore.communicationScore = body.communicationScore;
        if (body.depthOfAnswerScore !== undefined)
            groupDiscussionScore.depthOfAnswerScore = body.depthOfAnswerScore;
        if (body.technicalBitcoinFluencyScore !== undefined)
            groupDiscussionScore.technicalBitcoinFluencyScore =
                body.technicalBitcoinFluencyScore;
        if (body.engagementScore !== undefined)
            groupDiscussionScore.engagementScore = body.engagementScore;
        if (body.isBonusAttempted !== undefined)
            groupDiscussionScore.isBonusAttempted = body.isBonusAttempted;
        if (body.bonusAnswerScore !== undefined)
            groupDiscussionScore.bonusAnswerScore = body.bonusAnswerScore;
        if (body.bonusFollowupScore !== undefined)
            groupDiscussionScore.bonusFollowupScore = body.bonusFollowupScore;

        await this.groupDiscussionScoreRepository.save(groupDiscussionScore);

        if (body.isSubmitted !== undefined)
            exerciseScore.isSubmitted = body.isSubmitted;
        if (body.isPassing !== undefined)
            exerciseScore.isPassing = body.isPassing;
        if (body.hasGoodDocumentation !== undefined)
            exerciseScore.hasGoodDocumentation = body.hasGoodDocumentation;
        if (body.hasGoodStructure !== undefined)
            exerciseScore.hasGoodStructure = body.hasGoodStructure;

        await this.exerciseScoreRepository.save(exerciseScore);
    }

    async getUserScores(id: string): Promise<GetUsersScoresResponseDto> {
        const cohorts = await this.cohortRepository.find({
            where: {
                users: { id: id },
                weeks: {
                    groupDiscussionScores: {
                        user: { id: id },
                    },
                    exerciseScores: {
                        user: { id: id },
                    },
                },
            },
            relations: {
                weeks: {
                    groupDiscussionScores: {
                        user: true,
                    },
                    exerciseScores: {
                        user: true,
                    },
                },
            },
        });

        const cohortScore: GetCohortScoresResponseDto[] = [];
        let totalScore = 0;
        let maxTotalScore = 0;

        for (const cohort of cohorts) {
            const weeklyScores: WeeklyScore[] = [];
            let cohortTotalScore = 0;
            let cohortMaxTotalScore = 0;

            for (const week of cohort.weeks) {
                const groupDiscussionScore = week.groupDiscussionScores.find(
                    (score) => score.user.id === id,
                );
                const exerciseScore = week.exerciseScores.find(
                    (score) => score.user.id === id,
                );

                if (groupDiscussionScore && exerciseScore) {
                    const weeklyScore = new WeeklyScore({
                        weekId: week.id,
                        groupDiscussionScores: {
                            id: groupDiscussionScore.id,
                            attendance: groupDiscussionScore.attendance,
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
                            engagementScore:
                                groupDiscussionScore.engagementScore,
                            maxEngagementScore:
                                groupDiscussionScore.maxEngagementScore,
                            isBonusAttempted:
                                groupDiscussionScore.isBonusAttempted,
                            bonusAnswerScore:
                                groupDiscussionScore.bonusAnswerScore,
                            maxBonusAnswerScore:
                                groupDiscussionScore.maxBonusAnswerScore,
                            bonusFollowupScore:
                                groupDiscussionScore.bonusFollowupScore,
                            maxBonusFollowupScore:
                                groupDiscussionScore.maxBonusFollowupScore,
                            totalScore: groupDiscussionScore.totalScore,
                            maxTotalScore: groupDiscussionScore.maxScore,
                            groupNumber: groupDiscussionScore.groupNumber,
                        },
                        exerciseScores: {
                            id: exerciseScore.id,
                            isSubmitted: exerciseScore.isSubmitted,
                            isPassing: exerciseScore.isPassing,
                            hasGoodDocumentation:
                                exerciseScore.hasGoodDocumentation,
                            hasGoodStructure: exerciseScore.hasGoodStructure,
                            totalScore: exerciseScore.totalScore,
                            maxTotalScore: exerciseScore.maxScore,
                        },
                        totalScore:
                            groupDiscussionScore.totalScore +
                            exerciseScore.totalScore,
                        maxTotalScore:
                            groupDiscussionScore.maxScore +
                            exerciseScore.maxScore,
                    });

                    weeklyScores.push(weeklyScore);
                    cohortTotalScore += weeklyScore.totalScore;
                    cohortMaxTotalScore += weeklyScore.maxTotalScore;
                }
            }

            cohortScore.push(
                new GetCohortScoresResponseDto({
                    cohortId: cohort.id,
                    cohortType: cohort.type,
                    seasonNumber: cohort.season,
                    weeklyScores: weeklyScores,
                    totalScore: cohortTotalScore,
                    maxTotalScore: cohortMaxTotalScore,
                }),
            );

            totalScore += cohortTotalScore;
            maxTotalScore += cohortMaxTotalScore;
        }

        return new GetUsersScoresResponseDto({
            cohorts: cohortScore,
            totalScore: totalScore,
            maxTotalScore: maxTotalScore,
        });
    }

    async assignGroupsForCohortWeek(
        currentWeekId: string,
        body: AssignGroupsRequestDto,
    ): Promise<void> {
        // First, check if this is week 0 - if so, set all groups to 1
        const currentWeek = await this.cohortWeekRepository.findOne({
            where: { id: currentWeekId },
            relations: { cohort: true },
        });

        if (!currentWeek) {
            throw new ServiceError(`Week with id ${currentWeekId} not found`);
        }

        // Get all users in the cohort with their scores for current week
        const currentWeekUsers = await this.userRepository.find({
            where: {
                groupDiscussionScores: {
                    cohortWeek: { id: currentWeekId },
                },
                exerciseScores: {
                    cohortWeek: { id: currentWeekId },
                },
            },
            relations: {
                groupDiscussionScores: {
                    cohortWeek: true,
                },
                exerciseScores: {
                    cohortWeek: true,
                },
            },
        });

        // Filter users to only those with scores for the current week
        const usersWithCurrentWeekScores = currentWeekUsers.filter((user) =>
            user.groupDiscussionScores.some(
                (score) => score.cohortWeek.id === currentWeekId,
            ),
        );

        // If this is week 0, set all groups to null
        if (currentWeek.week === 0) {
            const groupDiscussionScoreIds: string[] = [];

            for (const user of usersWithCurrentWeekScores) {
                const currentWeekGD = user.groupDiscussionScores.find(
                    (score) => score.cohortWeek.id === currentWeekId,
                );

                if (!currentWeekGD)
                    throw new ServiceError(
                        `Group discussion score for user ${user.id} in week ${currentWeekId} not found`,
                    );

                groupDiscussionScoreIds.push(currentWeekGD.id);
            }

            await this.groupDiscussionScoreRepository.update(
                groupDiscussionScoreIds,
                { groupNumber: 0 },
            );

            return;
        }

        const previousWeek = await this.cohortWeekRepository.findOne({
            where: {
                cohort: { id: currentWeek.cohort.id },
                week: currentWeek.week - 1,
            },
            relations: {
                groupDiscussionScores: { user: true },
            },
        });

        if (!previousWeek) {
            throw new BadRequestException(
                `Previous week for cohort ${currentWeek.cohort.id} and week ${currentWeek.week} not found`,
            );
        }

        const eligibleUsers: Array<{
            user: User;
            totalScore: number;
            currentWeekGD: GroupDiscussionScore;
            wasPresentPreviousWeek: boolean;
        }> = [];

        for (const user of usersWithCurrentWeekScores) {
            const currentWeekGD = user.groupDiscussionScores.find(
                (score) => score.cohortWeek.id === currentWeekId,
            );

            // Check if user was present in previous week
            const previousWeekGD = previousWeek.groupDiscussionScores.find(
                (score) => score.user.id === user.id,
            );

            if (!currentWeekGD)
                throw new ServiceError(
                    `Group discussion score for user ${user.id} in week ${currentWeekId} not found`,
                );
            if (!previousWeekGD)
                throw new ServiceError(
                    `Group discussion score for user ${user.id} in previous week ${previousWeek.id} not found`,
                );

            const wasPresentPreviousWeek = previousWeekGD.attendance;
            const score = previousWeekGD.totalScore;

            eligibleUsers.push({
                user,
                totalScore: score,
                currentWeekGD,
                wasPresentPreviousWeek,
            });
        }

        // Sort eligible users by attendance (true first) and total score (descending)
        eligibleUsers.sort((a, b) => {
            if (b.wasPresentPreviousWeek !== a.wasPresentPreviousWeek)
                return b.wasPresentPreviousWeek ? 1 : -1; // Prioritize users with attendance in the previous week

            return b.totalScore - a.totalScore; // Then sort by total score
        });

        const updates: GroupDiscussionScore[] = [];
        const totalNumberOfGroups = body.groupsAvailable;
        const participantsPerWeek = body.participantsPerWeek; // participants per group
        const totalCapacity = totalNumberOfGroups * participantsPerWeek;

        for (let i = 0; i < eligibleUsers.length; i++) {
            const { currentWeekGD, wasPresentPreviousWeek } = eligibleUsers[i];

            // Skip users who were not present in the previous week, they go to group 0
            if (!wasPresentPreviousWeek) continue;

            // Assign groups based on performance
            // All top performers up to capacity are assigned to the same group
            // Everyone beyond capacity gets evenly distributed between groups
            if (i < totalCapacity) {
                // Blocks of size participantsPerWeek map to groups 1..totalNumberOfGroups
                currentWeekGD.groupNumber =
                    Math.floor(i / participantsPerWeek) + 1;
            } else {
                // Distribute remaining users evenly across all groups
                const overflowIndex = i - totalCapacity;
                currentWeekGD.groupNumber =
                    (overflowIndex % totalNumberOfGroups) + 1;
            }

            updates.push(currentWeekGD);
        }

        // Save all updates
        await this.groupDiscussionScoreRepository.save(updates);
    }

    async assignSelfToGroup(
        weekId: string,
        userId: string,
        groupNumber: number,
    ) {
        const groupDiscussionScores =
            await this.groupDiscussionScoreRepository.find({
                where: {
                    cohortWeek: { id: weekId },
                    groupNumber: groupNumber,
                },
            });

        if (groupDiscussionScores.length === 0) {
            throw new BadRequestException(
                `No group found for week ${weekId} and group number ${groupNumber}`,
            );
        }

        await this.groupDiscussionScoreRepository.update(
            {
                cohortWeek: { id: weekId },
                groupNumber: groupNumber,
            },
            { assignedTeachingAssistant: { id: userId } },
        );
    }
}
