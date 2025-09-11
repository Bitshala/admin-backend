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

@Injectable()
export class ScoresService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        @InjectRepository(Cohort)
        private readonly cohortRepository: Repository<Cohort>,
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
}
