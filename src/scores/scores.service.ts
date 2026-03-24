import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { GroupDiscussionScore } from '@/entities/group-discussion-score.entity';
import { Attendance } from '@/entities/attendance.entity';
import { Repository } from 'typeorm';
import { ExerciseScore } from '@/entities/exercise-score.entity';
import { User } from '@/entities/user.entity';
import {
    GetCohortScoresResponseDto,
    GetUsersScoresResponseDto,
    LeaderboardEntryDto,
    ListScoresForCohortAndWeekResponseDto,
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
import { CohortWeekType, UserRole } from '@/common/enum';

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
        @InjectRepository(Attendance)
        private readonly attendanceRepository: Repository<Attendance>,
    ) {}

    async listScoresForCohortAndWeek(
        cohortId: string,
        cohortWeekId: string,
    ): Promise<ListScoresForCohortAndWeekResponseDto> {
        const cohortWeek = await this.cohortWeekRepository.findOne({
            where: {
                id: cohortWeekId,
                cohort: {
                    id: cohortId,
                },
            },
            relations: { cohort: true },
        });

        if (!cohortWeek) {
            throw new BadRequestException(
                `Cohort week with id ${cohortWeekId} not found for cohort ${cohortId}`,
            );
        }

        const hasExercise = cohortWeek.hasExercise;
        const hasGroupDiscussion =
            cohortWeek.type === CohortWeekType.GROUP_DISCUSSION;
        const usersWithScores = await this.userRepository.find({
            where: {
                attendances: {
                    cohort: { id: cohortId },
                    cohortWeek: { id: cohortWeekId },
                },
                ...(hasGroupDiscussion && {
                    groupDiscussionScores: {
                        cohort: { id: cohortId },
                        cohortWeek: { id: cohortWeekId },
                    },
                    ...(hasExercise && {
                        exerciseScores: {
                            cohort: { id: cohortId },
                            cohortWeek: { id: cohortWeekId },
                        },
                    }),
                }),
            },
            relations: {
                attendances: true,
                ...(hasGroupDiscussion && {
                    groupDiscussionScores: {
                        assignedTeachingAssistant: true,
                    },
                    ...(hasExercise && {
                        exerciseScores: true,
                    }),
                }),
            },
        });

        return new ListScoresForCohortAndWeekResponseDto({
            scores: usersWithScores
                .map<UsersWeekScoreResponseDto>((u) =>
                    UsersWeekScoreResponseDto.fromUserWithScore(
                        u,
                        cohortWeekId,
                    ),
                )
                .sort((a, b) => {
                    const aGroup = a.groupDiscussionScores?.groupNumber ?? null;
                    const bGroup = b.groupDiscussionScores?.groupNumber ?? null;
                    if (
                        aGroup !== null &&
                        bGroup !== null &&
                        aGroup !== bGroup
                    ) {
                        return aGroup - bGroup;
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
        const [attendance, groupDiscussionScore, exerciseScore] =
            await Promise.all([
                this.attendanceRepository.findOne({
                    where: {
                        user: { id: userId },
                        cohort: { id: cohortId },
                        cohortWeek: { id: weekId },
                    },
                }),
                this.groupDiscussionScoreRepository.findOne({
                    where: {
                        user: { id: userId },
                        cohort: { id: cohortId },
                        cohortWeek: { id: weekId },
                    },
                }),
                this.exerciseScoreRepository.findOne({
                    where: {
                        user: { id: userId },
                        cohort: { id: cohortId },
                        cohortWeek: { id: weekId },
                    },
                }),
            ]);

        if (!attendance) {
            throw new ServiceError(
                `Attendance for user ${userId} in cohort ${cohortId} and week ${weekId} not found`,
            );
        }
        if (body.attendance !== undefined) {
            attendance.attended = body.attendance;
            await this.attendanceRepository.save(attendance);
        }

        if (groupDiscussionScore) {
            if (body.communicationScore !== undefined)
                groupDiscussionScore.communicationScore =
                    body.communicationScore;
            if (body.depthOfAnswerScore !== undefined)
                groupDiscussionScore.depthOfAnswerScore =
                    body.depthOfAnswerScore;
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
                groupDiscussionScore.bonusFollowupScore =
                    body.bonusFollowupScore;

            if (body.groupNumber !== undefined)
                groupDiscussionScore.groupNumber = body.groupNumber;

            if (body.teachingAssistantId !== undefined) {
                if (body.teachingAssistantId === null) {
                    groupDiscussionScore.assignedTeachingAssistant =
                        null as unknown as User;
                } else {
                    const teachingAssistant = await this.userRepository.findOne(
                        {
                            where: { id: body.teachingAssistantId },
                        },
                    );

                    if (!teachingAssistant) {
                        throw new BadRequestException(
                            `User with id ${userId} not found`,
                        );
                    }

                    if (
                        teachingAssistant.role !==
                            UserRole.TEACHING_ASSISTANT &&
                        teachingAssistant.role !== UserRole.ADMIN
                    ) {
                        throw new BadRequestException(
                            `User with id ${userId} is not a TA or Admin`,
                        );
                    }

                    groupDiscussionScore.assignedTeachingAssistant =
                        teachingAssistant;
                }
            }

            await this.groupDiscussionScoreRepository.save(
                groupDiscussionScore,
            );
        }

        if (exerciseScore) {
            if (body.isSubmitted !== undefined)
                exerciseScore.isSubmitted = body.isSubmitted;
            if (body.isPassing !== undefined)
                exerciseScore.isPassing = body.isPassing;

            await this.exerciseScoreRepository.save(exerciseScore);
        }
    }

    async getUserScores(id: string): Promise<GetUsersScoresResponseDto> {
        const cohorts = (
            await Promise.all([
                this.cohortRepository.find({
                    where: {
                        users: { id: id },
                        hasExercises: true,
                        weeks: {
                            attendances: {
                                user: { id: id },
                            },
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
                            attendances: {
                                user: true,
                            },
                            groupDiscussionScores: {
                                user: true,
                            },
                            exerciseScores: {
                                user: true,
                            },
                        },
                    },
                }),
                this.cohortRepository.find({
                    where: {
                        users: { id: id },
                        hasExercises: false,
                        weeks: {
                            attendances: {
                                user: { id: id },
                            },
                            groupDiscussionScores: {
                                user: { id: id },
                            },
                        },
                    },
                    relations: {
                        weeks: {
                            attendances: {
                                user: true,
                            },
                            groupDiscussionScores: {
                                user: true,
                            },
                        },
                    },
                }),
            ])
        ).flat();

        const cohortScore: GetCohortScoresResponseDto[] = [];
        let totalScore = 0;
        let maxTotalScore = 0;

        for (const cohort of cohorts) {
            const weeklyScores: WeeklyScore[] = [];
            let cohortTotalScore = 0;
            let cohortMaxTotalScore = 0;

            for (const week of cohort.weeks) {
                const attendance = week.attendances?.find(
                    (a) => a.user.id === id,
                );
                const groupDiscussionScore =
                    week.groupDiscussionScores?.find(
                        (score) => score.user.id === id,
                    ) ?? null;
                const exerciseScore =
                    week.exerciseScores?.find(
                        (score) => score.user.id === id,
                    ) ?? null;

                if (attendance) {
                    const weeklyScore = WeeklyScore.fromScores(
                        week.id,
                        attendance,
                        groupDiscussionScore,
                        exerciseScore,
                    );

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
        const currentWeek = await this.cohortWeekRepository.findOne({
            where: { id: currentWeekId },
            relations: { cohort: true },
        });

        if (!currentWeek) {
            throw new ServiceError(`Week with id ${currentWeekId} not found`);
        }

        // Week 0 has no GD records, nothing to assign groups for
        if (
            [CohortWeekType.GRADUATION, CohortWeekType.ORIENTATION].includes(
                currentWeek.type,
            )
        ) {
            return;
        }

        // Get all users in the cohort with their scores for current week
        const currentWeekUsers = await this.userRepository.find({
            where: {
                attendances: {
                    cohortWeek: { id: currentWeekId },
                },
                groupDiscussionScores: {
                    cohortWeek: { id: currentWeekId },
                },
            },
            relations: {
                attendances: {
                    cohortWeek: true,
                },
                groupDiscussionScores: {
                    cohortWeek: true,
                    assignedTeachingAssistant: true,
                },
            },
        });

        // Filter users to only those with attendance for the current week
        const usersWithCurrentWeekScores = currentWeekUsers.filter((user) =>
            user.attendances.some((a) => a.cohortWeek.id === currentWeekId),
        );

        const previousWeek = await this.cohortWeekRepository.findOne({
            where: {
                cohort: { id: currentWeek.cohort.id },
                week: currentWeek.week - 1,
            },
            relations: {
                attendances: { user: true },
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

            // Check if user was present in the previous week via attendances
            const previousAttendance = previousWeek.attendances.find(
                (a) => a.user.id === user.id,
            );

            // Previous week GD may not exist (e.g., week 0)
            const previousWeekGD = previousWeek.groupDiscussionScores?.find(
                (score) => score.user.id === user.id,
            );

            if (!currentWeekGD)
                throw new ServiceError(
                    `Group discussion score for user ${user.id} in week ${currentWeekId} not found`,
                );
            if (!previousAttendance)
                throw new ServiceError(
                    `Attendance for user ${user.id} in previous week ${previousWeek.id} not found`,
                );

            const wasPresentPreviousWeek = previousAttendance.attended;
            const score = previousWeekGD?.scaledScore ?? 0;

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

            if (b.totalScore !== a.totalScore)
                return b.totalScore - a.totalScore; // Then sort by total score

            return b.user.id.localeCompare(a.user.id); // Finally, sort by user ID for consistency
        });

        const updates: GroupDiscussionScore[] = [];
        const totalNumberOfGroups = body.groupsAvailable;
        const participantsPerWeek = body.participantsPerWeek; // participants per group
        const totalCapacity = totalNumberOfGroups * participantsPerWeek;
        const taMap: Map<number, User> = new Map();

        for (let i = 0; i < eligibleUsers.length; i++) {
            const { currentWeekGD, wasPresentPreviousWeek } = eligibleUsers[i];

            // Skip users who were not present in the previous week, they go to group 0
            if (!wasPresentPreviousWeek) continue;

            // Assign groups based on performance
            // All top performers up to capacity are assigned to the same group
            // Everyone beyond capacity gets evenly distributed between groups
            if (i < totalCapacity) {
                // Blocks of size participantsPerWeek map to groups 1...totalNumberOfGroups
                currentWeekGD.groupNumber =
                    Math.floor(i / participantsPerWeek) + 1;
            } else {
                // Distribute remaining users evenly across all groups
                const overflowIndex = i - totalCapacity;
                currentWeekGD.groupNumber =
                    (overflowIndex % totalNumberOfGroups) + 1;
            }

            if (
                currentWeekGD.assignedTeachingAssistant &&
                !taMap.has(currentWeekGD.groupNumber)
            ) {
                taMap.set(
                    currentWeekGD.groupNumber,
                    currentWeekGD.assignedTeachingAssistant,
                );
            }

            currentWeekGD.assignedTeachingAssistant = null as unknown as User; // Clear existing TA assignment, will reassign after groups are set

            updates.push(currentWeekGD);
        }

        for (const gdScore of updates) {
            if (gdScore.groupNumber === null) continue;
            const assignedTA = taMap.get(gdScore.groupNumber);
            if (assignedTA) gdScore.assignedTeachingAssistant = assignedTA;
        }

        // Save all updates
        await this.groupDiscussionScoreRepository.save(updates);
    }

    async assignTAToGroup(weekId: string, userId: string, groupNumber: number) {
        const user = await this.userRepository.findOne({
            where: { id: userId },
        });

        if (!user) {
            throw new BadRequestException(`User with id ${userId} not found`);
        }

        if (
            user.role !== UserRole.TEACHING_ASSISTANT &&
            user.role !== UserRole.ADMIN
        ) {
            throw new BadRequestException(
                `User with id ${userId} is not a TA or Admin`,
            );
        }

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

    async getCohortLeaderboard(
        cohortId: string,
    ): Promise<LeaderboardEntryDto[]> {
        const cohort = await this.cohortRepository.findOne({
            where: { id: cohortId },
        });

        if (!cohort) {
            throw new BadRequestException(
                `Cohort with id ${cohortId} not found`,
            );
        }

        const usersWithScores = cohort.hasExercises
            ? await this.userRepository.find({
                  where: {
                      attendances: {
                          cohort: { id: cohortId },
                      },
                      groupDiscussionScores: {
                          cohort: { id: cohortId },
                      },
                      exerciseScores: {
                          cohort: { id: cohortId },
                      },
                  },
                  relations: {
                      attendances: {
                          cohortWeek: true,
                      },
                      groupDiscussionScores: true,
                      exerciseScores: true,
                  },
              })
            : await this.userRepository.find({
                  where: {
                      attendances: {
                          cohort: { id: cohortId },
                      },
                      groupDiscussionScores: {
                          cohort: { id: cohortId },
                      },
                  },
                  relations: {
                      attendances: true,
                      groupDiscussionScores: true,
                  },
              });

        return usersWithScores
            .map<LeaderboardEntryDto>((u) =>
                LeaderboardEntryDto.fromUserWithScores(u),
            )
            .sort((a, b) => {
                // sort by exercise total score desc, then by total score desc
                if (b.exerciseTotalScore !== a.exerciseTotalScore)
                    return b.exerciseTotalScore - a.exerciseTotalScore;
                return b.totalScore - a.totalScore;
            });
    }
}
