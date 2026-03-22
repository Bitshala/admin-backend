import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cohort } from '@/entities/cohort.entity';
import { Repository } from 'typeorm';
import {
    CreateCohortRequestDto,
    JoinWaitlistRequestDto,
    UpdateCohortRequestDto,
    UpdateCohortWeekRequestDto,
} from '@/cohorts/cohorts.request.dto';
import { DbTransactionService } from '@/db-transaction/db-transaction.service';
import { CohortWeek } from '@/entities/cohort-week.entity';
import { randomUUID } from 'crypto';
import {
    GetCohortResponseDto,
    ListAvailableCohortsResponseDto,
    PublicCohortResponseDto,
    UserCohortWaitlistResponseDto,
} from '@/cohorts/cohorts.response.dto';
import { PaginatedDataDto, PaginatedQueryDto } from '@/common/dto';
import { User } from '@/entities/user.entity';
import { GroupDiscussionScore } from '@/entities/group-discussion-score.entity';
import { Attendance } from '@/entities/attendance.entity';
import { ExerciseScore } from '@/entities/exercise-score.entity';
import { DiscordClient } from '@/discord-client/discord.client';
import { ConfigService } from '@nestjs/config';
import { CohortType, CohortWeekType } from '@/common/enum';
import { CohortWaitlist } from '@/entities/cohort-waitlist.entity';
import { APITask } from '@/entities/api-task.entity';
import { TaskType } from '@/task-processor/task.enums';
import { MailService } from '@/mail/mail.service';
import { CohortsConfigService } from '@/cohorts/cohorts.config.service';
import { CohortCalendarService } from '@/cohort-calendar/cohort-calendar.service';

@Injectable()
export class CohortsService {
    private readonly logger = new Logger(CohortsService.name);

    private readonly masteringBitcoinDiscordRoleId: string;
    private readonly learningBitcoinFromCommandLineDiscordRoleId: string;
    private readonly programmingBitcoinDiscordRoleId: string;
    private readonly bitcoinProtocolDevelopmentDiscordRoleId: string;
    private readonly masteringLightningNetworkDiscordRoleId: string;

    constructor(
        @InjectRepository(Cohort)
        private readonly cohortRepository: Repository<Cohort>,
        @InjectRepository(CohortWeek)
        private readonly cohortWeekRepository: Repository<CohortWeek>,
        @InjectRepository(CohortWaitlist)
        private readonly cohortWaitlistRepository: Repository<CohortWaitlist>,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        private readonly dbTransactionService: DbTransactionService,
        private readonly discordClient: DiscordClient,
        private readonly configService: ConfigService,
        private readonly mailService: MailService,
        private readonly cohortConfigService: CohortsConfigService,
        private readonly cohortCalendarService: CohortCalendarService,
    ) {
        this.masteringBitcoinDiscordRoleId =
            this.configService.getOrThrow<string>(
                'discord.roles.masteringBitcoin',
            );
        this.learningBitcoinFromCommandLineDiscordRoleId =
            this.configService.getOrThrow<string>(
                'discord.roles.learningBitcoinFromCommandLine',
            );
        this.programmingBitcoinDiscordRoleId =
            this.configService.getOrThrow<string>(
                'discord.roles.programmingBitcoin',
            );
        this.bitcoinProtocolDevelopmentDiscordRoleId =
            this.configService.getOrThrow<string>(
                'discord.roles.bitcoinProtocolDevelopment',
            );
        this.masteringLightningNetworkDiscordRoleId =
            this.configService.getOrThrow<string>(
                'discord.roles.masteringLightningNetwork',
            );
    }

    async getCohort(cohortId: string): Promise<GetCohortResponseDto> {
        const cohort: Cohort | null = await this.cohortRepository.findOne({
            where: { id: cohortId },
            relations: { weeks: true },
        });

        if (!cohort) {
            throw new BadRequestException(
                `Cohort with id ${cohortId} does not exist.`,
            );
        }

        return GetCohortResponseDto.fromEntity(cohort);
    }

    private mapLatestCohortsToPublicCohortResponseDto(
        cohorts: Cohort[],
        type: CohortType,
    ): PublicCohortResponseDto | null {
        return (
            cohorts
                .filter((cohort) => cohort.type === type)
                .map(
                    (cohort) =>
                        new PublicCohortResponseDto({
                            type: cohort.type,
                            season: cohort.season,
                            startDate: cohort.startDate.toISOString(),
                            endDate: cohort.endDate.toISOString(),
                            registrationDeadline:
                                cohort.registrationDeadline.toISOString(),
                        }),
                )[0] || null
        );
    }

    async listCohorts(
        query: PaginatedQueryDto,
    ): Promise<PaginatedDataDto<GetCohortResponseDto>> {
        const [cohorts, total]: [Cohort[], number] =
            await this.cohortRepository.findAndCount({
                skip: query.page * query.pageSize,
                take: query.pageSize,
                order: { createdAt: 'DESC' },
                relations: { weeks: true },
            });

        return new PaginatedDataDto({
            totalRecords: total,
            records: cohorts.map(GetCohortResponseDto.fromEntity),
        });
    }

    async listPublicCohorts(): Promise<ListAvailableCohortsResponseDto> {
        const latestCohorts = await this.cohortRepository
            .createQueryBuilder('c')
            .distinctOn(['c.type'])
            .orderBy('c.type', 'ASC')
            .addOrderBy('c.season', 'DESC')
            .getMany();

        return {
            [CohortType.MASTERING_LIGHTNING_NETWORK]:
                this.mapLatestCohortsToPublicCohortResponseDto(
                    latestCohorts,
                    CohortType.MASTERING_LIGHTNING_NETWORK,
                ),
            [CohortType.MASTERING_BITCOIN]:
                this.mapLatestCohortsToPublicCohortResponseDto(
                    latestCohorts,
                    CohortType.MASTERING_BITCOIN,
                ),
            [CohortType.LEARNING_BITCOIN_FROM_COMMAND_LINE]:
                this.mapLatestCohortsToPublicCohortResponseDto(
                    latestCohorts,
                    CohortType.LEARNING_BITCOIN_FROM_COMMAND_LINE,
                ),
            [CohortType.PROGRAMMING_BITCOIN]:
                this.mapLatestCohortsToPublicCohortResponseDto(
                    latestCohorts,
                    CohortType.PROGRAMMING_BITCOIN,
                ),
            [CohortType.BITCOIN_PROTOCOL_DEVELOPMENT]:
                this.mapLatestCohortsToPublicCohortResponseDto(
                    latestCohorts,
                    CohortType.BITCOIN_PROTOCOL_DEVELOPMENT,
                ),
        };
    }

    async listMyCohorts(
        user: User,
        query: PaginatedQueryDto,
    ): Promise<PaginatedDataDto<GetCohortResponseDto>> {
        const [cohorts, total]: [Cohort[], number] =
            await this.cohortRepository.findAndCount({
                where: {
                    users: { id: user.id },
                },
                skip: query.page * query.pageSize,
                take: query.pageSize,
                order: { createdAt: 'DESC' },
                relations: { weeks: true },
            });

        return new PaginatedDataDto({
            totalRecords: total,
            records: cohorts.map(GetCohortResponseDto.fromEntity),
        });
    }

    async createCohort(cohortData: CreateCohortRequestDto): Promise<void> {
        const config = this.cohortConfigService.getConfig(cohortData.type);
        const totalWeeks = config.gdSessions + 2; // orientation + GD weeks + graduation

        await this.dbTransactionService.execute(
            async (manager): Promise<void> => {
                // Auto-calculate season
                const result = await manager
                    .createQueryBuilder(Cohort, 'c')
                    .select('MAX(c.season)', 'maxSeason')
                    .where('c.type = :type', { type: cohortData.type })
                    .getRawOne();
                const season: number = (result?.maxSeason ?? 0) + 1;

                const cohortAlreadyExists: boolean = await manager.exists(
                    Cohort,
                    {
                        where: {
                            type: cohortData.type,
                            season: season,
                        },
                    },
                );

                if (cohortAlreadyExists) {
                    throw new BadRequestException(
                        `Cohort of type ${cohortData.type} and season ${season} already exists.`,
                    );
                }

                const startDate = new Date(cohortData.startDate);
                startDate.setUTCHours(0, 0, 0, 0);
                const registrationDeadline = new Date(
                    cohortData.registrationDeadline,
                );
                registrationDeadline.setUTCHours(0, 0, 0, 0);

                // Calculate endDate: startDate + totalWeeks * 7 days
                const endDate = new Date(startDate);
                endDate.setUTCDate(endDate.getUTCDate() + totalWeeks * 7);

                if (registrationDeadline >= endDate) {
                    throw new BadRequestException(
                        `Registration deadline must be before the end date.`,
                    );
                }
                if (startDate >= endDate) {
                    throw new BadRequestException(
                        `Start date must be before the end date.`,
                    );
                }

                const hasExercises = config.weeks.some((w) => w.hasExercise);

                const cohort = new Cohort();
                cohort.id = randomUUID();
                cohort.type = cohortData.type;
                cohort.season = season;
                cohort.startDate = startDate;
                cohort.endDate = endDate;
                cohort.registrationDeadline = registrationDeadline;
                cohort.hasExercises = hasExercises;
                cohort.weeks = [];

                if (hasExercises) cohort.classroomId = config.classroomId;

                await manager.save(cohort);

                for (
                    let weekNumber = 0;
                    weekNumber < totalWeeks;
                    weekNumber++
                ) {
                    const week: CohortWeek = new CohortWeek();
                    week.id = randomUUID();
                    week.week = weekNumber;
                    week.cohort = cohort;

                    if (weekNumber === 0) {
                        week.type = CohortWeekType.ORIENTATION;
                        week.hasExercise = false;
                        week.questions = [];
                        week.bonusQuestion = [];
                    } else if (weekNumber <= config.gdSessions) {
                        const weekConfig = config.weeks[weekNumber - 1];
                        week.type = CohortWeekType.GROUP_DISCUSSION;
                        week.hasExercise = weekConfig.hasExercise;
                        week.questions = weekConfig.questions;
                        week.bonusQuestion = weekConfig.bonusQuestions;
                    } else {
                        week.type = CohortWeekType.GRADUATION;
                        week.hasExercise = false;
                        week.questions = [];
                        week.bonusQuestion = [];
                    }

                    cohort.weeks.push(week);
                }

                await manager.save(cohort.weeks);

                // Create an initial sync task when cohort is created
                const apiTask = new APITask<TaskType.SYNC_CLASSROOM_SCORES>();
                apiTask.type = TaskType.SYNC_CLASSROOM_SCORES;
                apiTask.data = { cohortId: cohort.id };
                await manager.save(apiTask);

                // Schedule reminder email tasks for each week (except graduation)
                const reminderTasks: APITask<TaskType.SEND_COHORT_REMINDER_EMAILS>[] =
                    cohort.weeks.map((week) => {
                        const executeOnTime = new Date(startDate);
                        executeOnTime.setUTCDate(
                            executeOnTime.getUTCDate() + week.week * 7,
                        );
                        // 12:00 PM IST = 06:30 UTC
                        executeOnTime.setUTCHours(6, 30, 0, 0);

                        const reminderTask =
                            new APITask<TaskType.SEND_COHORT_REMINDER_EMAILS>();
                        reminderTask.type =
                            TaskType.SEND_COHORT_REMINDER_EMAILS;
                        reminderTask.data = {
                            cohortId: cohort.id,
                            cohortWeekId: week.id,
                        };
                        reminderTask.executeOnTime = executeOnTime;

                        return reminderTask;
                    });

                await manager.save(reminderTasks);

                // Schedule feedback reminder emails (day after 4th GD session)
                const feedbackReminderTime = new Date(startDate);
                feedbackReminderTime.setUTCDate(
                    feedbackReminderTime.getUTCDate() + 4 * 7 + 1,
                );
                // 12:00 PM IST = 06:30 UTC
                feedbackReminderTime.setUTCHours(6, 30, 0, 0);

                const feedbackTask =
                    new APITask<TaskType.SEND_FEEDBACK_REMINDER_EMAILS>();
                feedbackTask.type = TaskType.SEND_FEEDBACK_REMINDER_EMAILS;
                feedbackTask.data = { cohortId: cohort.id };
                feedbackTask.executeOnTime = feedbackReminderTime;

                await manager.save(feedbackTask);
            },
        );
    }

    async updateCohort(
        cohortId: string,
        cohortData: UpdateCohortRequestDto,
    ): Promise<void> {
        const cohort: Cohort | null = await this.cohortRepository.findOne({
            where: { id: cohortId },
        });

        if (!cohort) {
            throw new BadRequestException(
                `Cohort with id ${cohortId} does not exist.`,
            );
        }

        const originalStartDate = cohort.startDate;

        if (cohortData.startDate) {
            const startDate = new Date(cohortData.startDate);
            startDate.setUTCHours(0, 0, 0, 0);
            cohort.startDate = startDate;

            const config = this.cohortConfigService.getConfig(cohort.type);
            const totalWeeks = config.gdSessions + 2;
            const endDate = new Date(startDate);
            endDate.setUTCDate(endDate.getUTCDate() + totalWeeks * 7);
            cohort.endDate = endDate;
        }
        if (cohortData.registrationDeadline) {
            const registrationDeadline = new Date(
                cohortData.registrationDeadline,
            );
            registrationDeadline.setUTCHours(0, 0, 0, 0);
            cohort.registrationDeadline = registrationDeadline;
        }

        await this.dbTransactionService.execute(async (manager) => {
            await manager.save(Cohort, cohort);

            if (
                cohortData.startDate &&
                cohort.startDate.getTime() !== originalStartDate.getTime()
            ) {
                const apiTask =
                    new APITask<TaskType.SEND_CALENDAR_UPDATE_EMAILS>();
                apiTask.type = TaskType.SEND_CALENDAR_UPDATE_EMAILS;
                apiTask.data = { cohortId };
                await manager.save(APITask, apiTask);
            }
        });
    }

    async updateCohortWeek(
        cohortWeekId: string,
        cohortWeekData: UpdateCohortWeekRequestDto,
    ): Promise<void> {
        const cohortWeek: CohortWeek | null =
            await this.cohortWeekRepository.findOne({
                where: { id: cohortWeekId },
            });

        if (!cohortWeek) {
            throw new BadRequestException(
                `Cohort week with id ${cohortWeekId} does not exist.`,
            );
        }

        if (cohortWeekData.questions) {
            cohortWeek.questions = cohortWeekData.questions;
        }
        if (cohortWeekData.bonusQuestion) {
            cohortWeek.bonusQuestion = cohortWeekData.bonusQuestion;
        }
        if (cohortWeekData.classroomAssignmentId !== undefined) {
            cohortWeek.classroomAssignmentId =
                cohortWeekData.classroomAssignmentId;
        }

        await this.cohortWeekRepository.save(cohortWeek);
    }

    async assignDiscordRole(userId: string, cohortType: CohortType) {
        const user = await this.userRepository.findOneOrFail({
            where: { id: userId },
        });

        let roleId: string;

        switch (cohortType) {
            case CohortType.MASTERING_BITCOIN:
                roleId = this.masteringBitcoinDiscordRoleId;
                break;
            case CohortType.LEARNING_BITCOIN_FROM_COMMAND_LINE:
                roleId = this.learningBitcoinFromCommandLineDiscordRoleId;
                break;
            case CohortType.PROGRAMMING_BITCOIN:
                roleId = this.programmingBitcoinDiscordRoleId;
                break;
            case CohortType.BITCOIN_PROTOCOL_DEVELOPMENT:
                roleId = this.bitcoinProtocolDevelopmentDiscordRoleId;
                break;
            case CohortType.MASTERING_LIGHTNING_NETWORK:
                roleId = this.masteringLightningNetworkDiscordRoleId;
                break;
            default:
                throw new BadRequestException(
                    `Invalid cohort type: ${cohortType}`,
                );
        }

        if (!user.isGuildMember) {
            throw new BadRequestException(
                `User is not a member of the Discord guild.`,
            );
        }

        await this.discordClient.attachRoleToMember(user.discordUserId, roleId);
    }

    async addUserToCohort(userId: string, cohortId: string) {
        const user: User | null = await this.userRepository.findOne({
            where: {
                id: userId,
            },
        });

        if (!user) {
            throw new BadRequestException(
                `User with id ${userId} does not exist.`,
            );
        }

        await this.joinCohort(user, cohortId);
    }

    async joinCohort(user: User, cohortId: string) {
        if (!user.email) {
            throw new BadRequestException(
                `User must have a verified email to join a cohort.`,
            );
        }

        const cohort: Cohort | null = await this.cohortRepository.findOne({
            where: { id: cohortId },
            relations: {
                weeks: true,
                users: true,
            },
        });

        if (!cohort) {
            throw new BadRequestException(
                `Cohort with id ${cohortId} does not exist.`,
            );
        }

        if (new Date() > cohort.registrationDeadline) {
            throw new BadRequestException(
                `Registration deadline for this cohort has passed.`,
            );
        }

        const alreadyEnrolled: boolean =
            cohort.users.some((enrolledUser) => enrolledUser.id === user.id) ??
            false;

        if (alreadyEnrolled) {
            throw new BadRequestException(
                `User is already enrolled in cohort.`,
            );
        }

        const waitlistEntry = await this.cohortWaitlistRepository.findOne({
            where: { user: { id: user.id }, type: cohort.type },
        });

        await this.dbTransactionService.execute(
            async (manager): Promise<void> => {
                if (!cohort.users) {
                    cohort.users = [user];
                } else {
                    cohort.users.push(user);
                }

                await manager.save(cohort);

                const attendances: Attendance[] = [];
                const groupDiscussionScores: GroupDiscussionScore[] = [];
                const exerciseScores: ExerciseScore[] = [];

                for (const week of cohort.weeks) {
                    const attendance = new Attendance();
                    attendance.user = user;
                    attendance.cohort = cohort;
                    attendance.cohortWeek = week;
                    attendances.push(attendance);

                    if (week.type === CohortWeekType.GROUP_DISCUSSION) {
                        const groupDiscussionScore = new GroupDiscussionScore();
                        groupDiscussionScore.user = user;
                        groupDiscussionScore.cohort = cohort;
                        groupDiscussionScore.cohortWeek = week;
                        groupDiscussionScores.push(groupDiscussionScore);
                    }

                    if (week.hasExercise) {
                        const exerciseScore = new ExerciseScore();
                        exerciseScore.user = user;
                        exerciseScore.cohort = cohort;
                        exerciseScore.cohortWeek = week;

                        exerciseScores.push(exerciseScore);
                    }
                }

                await manager.save(attendances);
                await manager.save(groupDiscussionScores);
                if (exerciseScores.length > 0)
                    await manager.save(exerciseScores);

                if (waitlistEntry) await manager.remove(waitlistEntry);

                const apiTask = new APITask<TaskType.ASSIGN_COHORT_ROLE>();
                apiTask.type = TaskType.ASSIGN_COHORT_ROLE;
                apiTask.data = {
                    userId: user.id,
                    cohortType: cohort.type,
                };
                await manager.save(apiTask);
            },
        );

        // Send cohort joining confirmation email with calendar invite
        const userName =
            user.name || user.discordGlobalName || user.discordUserName;

        try {
            const calendarInvite =
                await this.cohortCalendarService.generateCalendarInvite(
                    cohortId,
                );
            await this.mailService.sendCohortJoiningConfirmationEmail(
                user.email,
                userName,
                cohort.type,
                calendarInvite,
            );
        } catch (error) {
            this.logger.error(
                `Failed to send cohort joining confirmation email to user ${user.id}: ${error.message}`,
                error.stack,
            );
        }
    }

    async removeUserFromCohort(
        userId: string,
        cohortId: string,
    ): Promise<void> {
        const user: User | null = await this.userRepository.findOne({
            where: { id: userId },
        });

        if (!user) {
            throw new BadRequestException(
                `User with id ${userId} does not exist.`,
            );
        }

        const cohort: Cohort | null = await this.cohortRepository.findOne({
            where: { id: cohortId },
            relations: { users: true },
        });

        if (!cohort) {
            throw new BadRequestException(
                `Cohort with id ${cohortId} does not exist.`,
            );
        }

        const isEnrolled =
            cohort.users?.some((enrolledUser) => enrolledUser.id === user.id) ??
            false;

        if (!isEnrolled) {
            throw new BadRequestException('User is not enrolled in cohort.');
        }

        await this.dbTransactionService.execute(
            async (manager): Promise<void> => {
                await manager
                    .createQueryBuilder()
                    .relation(Cohort, 'users')
                    .of(cohort.id)
                    .remove(user.id);

                await manager.delete(Attendance, {
                    user: { id: user.id },
                    cohort: { id: cohort.id },
                });
                await manager.delete(GroupDiscussionScore, {
                    user: { id: user.id },
                    cohort: { id: cohort.id },
                });
                await manager.delete(ExerciseScore, {
                    user: { id: user.id },
                    cohort: { id: cohort.id },
                });
            },
        );
    }

    async joinCohortWaitlist(
        user: User,
        body: JoinWaitlistRequestDto,
    ): Promise<void> {
        if (!user.email) {
            throw new BadRequestException(
                `User must have a verified email to join a waitlist.`,
            );
        }

        const alreadyOnWaitlist: boolean =
            await this.cohortWaitlistRepository.exist({
                where: { user: { id: user.id }, type: body.type },
            });

        if (alreadyOnWaitlist) {
            throw new BadRequestException(
                `User is already on the waitlist for cohort type ${body.type}.`,
            );
        }

        const waitlistEntry = new CohortWaitlist();
        waitlistEntry.id = randomUUID();
        waitlistEntry.user = user;
        waitlistEntry.type = body.type;

        await this.cohortWaitlistRepository.save(waitlistEntry);

        try {
            // Send welcome email to the user
            await this.mailService.sendWelcomeToWaitlistEmail(
                user.email,
                user.name || user.discordGlobalName || user.discordUserName,
                body.type,
            );
        } catch (error) {
            this.logger.error(
                `Failed to send welcome to waitlist email to user ${user.id}: ${error.message}`,
                error.stack,
            );
        }
    }

    async getUserWaitlist(user: User): Promise<UserCohortWaitlistResponseDto> {
        const waitlistEntries: CohortWaitlist[] =
            await this.cohortWaitlistRepository.find({
                where: { user: { id: user.id } },
            });

        return {
            cohortWaitlist: waitlistEntries.map((entry) => entry.type),
        };
    }
}
