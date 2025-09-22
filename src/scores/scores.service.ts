import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { GroupDiscussionScore } from '@/entities/group-discussion-score.entity';
import { Repository } from 'typeorm';
import { ExerciseScore } from '@/entities/exercise-score.entity';
import { User } from '@/entities/user.entity';
import {
    UsersWeekScoreResponseDto,
    ListScoresForCohortAndWeekResponseDto,
    GetUsersScoresResponseDto,
    WeeklyScore,
    GetCohortScoresResponseDto,
} from '@/scores/scores.response.dto';
import { ServiceError } from '@/common/errors';
import { UpdateScoresRequestDto } from '@/scores/scores.request.dto';
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

        return new UsersWeekScoreResponseDto({
            userId: user.id,
            discordUsername: user.discordUserName,
            discordGlobalName: user.discordGlobalName,
            name: user.name,
            weekId: weekId,
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
                groupDiscussionScores: true,
                exerciseScores: true,
            },
        });

        return new ListScoresForCohortAndWeekResponseDto({
            scores: usersWithScores.map<UsersWeekScoreResponseDto>(
                (u) => this.userWithScoreToUsersScoreDto(u, cohortWeekId),
                this,
            ),
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
        cohortId: string,
        currentWeekId: string,
        previousWeekId?: string,
    ): Promise<void> {
        // First, check if this is week 0 - if so, set all groups to null
        const currentWeek = await this.cohortWeekRepository.findOne({
            where: { id: currentWeekId },
            select: { week: true },
        });

        if (!currentWeek) {
            throw new ServiceError(`Week with id ${currentWeekId} not found`);
        }

        // Get all users in the cohort with their scores for current week
        const currentWeekUsers = await this.userRepository.find({
            where: {
                groupDiscussionScores: {
                    cohort: { id: cohortId },
                    cohortWeek: { id: currentWeekId },
                },
                exerciseScores: {
                    cohort: { id: cohortId },
                    cohortWeek: { id: currentWeekId },
                },
            },
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

        // Filter users to only those with scores for current week
        const usersWithCurrentWeekScores = currentWeekUsers.filter((user) => {
            const hasCurrentWeekGD = user.groupDiscussionScores.some(
                (score) =>
                    score.cohort.id === cohortId &&
                    score.cohortWeek.id === currentWeekId,
            );
            const hasCurrentWeekEx = user.exerciseScores.some(
                (score) =>
                    score.cohort.id === cohortId &&
                    score.cohortWeek.id === currentWeekId,
            );
            return hasCurrentWeekGD && hasCurrentWeekEx;
        });

        // If this is week 0, set all groups to null
        if (currentWeek.week === 0) {
            const updates: GroupDiscussionScore[] = [];

            for (const user of usersWithCurrentWeekScores) {
                const currentWeekGD = user.groupDiscussionScores.find(
                    (score) =>
                        score.cohort.id === cohortId &&
                        score.cohortWeek.id === currentWeekId,
                );

                if (currentWeekGD) {
                    currentWeekGD.groupNumber = null;
                    updates.push(currentWeekGD);
                }
            }

            await this.groupDiscussionScoreRepository.save(updates);
            return;
        }

        const eligibleUsers: Array<{
            user: User;
            totalScore: number;
            currentWeekGD: GroupDiscussionScore;
            wasPresentPreviousWeek: boolean;
        }> = [];

        // If previous week ID is provided, check attendance from previous week
        if (previousWeekId) {
            for (const user of usersWithCurrentWeekScores) {
                const currentWeekGD = user.groupDiscussionScores.find(
                    (score) =>
                        score.cohort.id === cohortId &&
                        score.cohortWeek.id === currentWeekId,
                );
                const currentWeekEx = user.exerciseScores.find(
                    (score) =>
                        score.cohort.id === cohortId &&
                        score.cohortWeek.id === currentWeekId,
                );

                if (!currentWeekGD || !currentWeekEx) continue;

                // Check if user was present in previous week
                const previousWeekGD =
                    await this.groupDiscussionScoreRepository.findOne({
                        where: {
                            user: { id: user.id },
                            cohort: { id: cohortId },
                            cohortWeek: { id: previousWeekId },
                        },
                    });

                const wasPresentPreviousWeek =
                    previousWeekGD?.attendance || false;
                const totalScore =
                    currentWeekGD.totalScore + currentWeekEx.totalScore;

                // Only include users who have scores and were present in previous week
                if (wasPresentPreviousWeek) {
                    eligibleUsers.push({
                        user,
                        totalScore,
                        currentWeekGD,
                        wasPresentPreviousWeek,
                    });
                }
            }
        } else {
            // First week - include all users with scores
            for (const user of usersWithCurrentWeekScores) {
                const currentWeekGD = user.groupDiscussionScores.find(
                    (score) =>
                        score.cohort.id === cohortId &&
                        score.cohortWeek.id === currentWeekId,
                );
                const currentWeekEx = user.exerciseScores.find(
                    (score) =>
                        score.cohort.id === cohortId &&
                        score.cohortWeek.id === currentWeekId,
                );

                if (!currentWeekGD || !currentWeekEx) continue;

                const totalScore =
                    currentWeekGD.totalScore + currentWeekEx.totalScore;
                eligibleUsers.push({
                    user,
                    totalScore,
                    currentWeekGD,
                    wasPresentPreviousWeek: true, // Consider all eligible for first week
                });
            }
        }

        // Sort eligible users by total score (descending - highest scores first)
        eligibleUsers.sort((a, b) => b.totalScore - a.totalScore);

        // Assign groups using round-robin for top performers
        const updates: GroupDiscussionScore[] = [];

        for (let i = 0; i < eligibleUsers.length; i++) {
            const { currentWeekGD } = eligibleUsers[i];

            if (i < 24) {
                // First 24 users (top performers) - distribute evenly across groups 1, 2, 3
                // Groups: 1, 2, 3, 1, 2, 3, 1, 2, 3... (repeating pattern)
                const groupNumber = (i % 3) + 1;
                currentWeekGD.groupNumber = groupNumber;
            } else {
                // Users 25+ continue the round-robin pattern
                const groupNumber = (i % 3) + 1;
                currentWeekGD.groupNumber = groupNumber;
            }

            updates.push(currentWeekGD);
        }

        // Handle users who were absent in previous week or don't have scores
        const absentUsers = usersWithCurrentWeekScores.filter((user) => {
            return !eligibleUsers.some((eu) => eu.user.id === user.id);
        });

        for (const user of absentUsers) {
            const currentWeekGD = user.groupDiscussionScores.find(
                (score) =>
                    score.cohort.id === cohortId &&
                    score.cohortWeek.id === currentWeekId,
            );

            if (currentWeekGD) {
                currentWeekGD.groupNumber = 4; // Group 4 for absent/ineligible users
                updates.push(currentWeekGD);
            }
        }

        // Save all updates
        await this.groupDiscussionScoreRepository.save(updates);
    }
}
