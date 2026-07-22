import {
    BadRequestException,
    Injectable,
    Logger,
    NotFoundException,
    StreamableFile,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cohort } from '@/entities/cohort.entity';
import { In, Repository } from 'typeorm';
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
import { CohortType, CohortWeekType, UserRole } from '@/common/enum';
import { CohortMembership } from '@/entities/cohort-membership.entity';
import { CohortWaitlist } from '@/entities/cohort-waitlist.entity';
import { Certificate } from '@/entities/certificate.entity';
import { APITask } from '@/entities/api-task.entity';
import { APITaskStatus, TaskType } from '@/task-processor/task.enums';
import { isLastRetry } from '@/task-processor/task-processor.utils';
import { TWENTY_FOUR_HOURS_MS } from '@/common/durations.constants';
import { MailService } from '@/mail/mail.service';
import { CohortsConfigService } from '@/cohorts/cohorts.config.service';
import { CohortCalendarService } from '@/cohort-calendar/cohort-calendar.service';
import { createReadStream, existsSync } from 'fs';
import { join, basename } from 'path';
import { lookup } from 'mime-types';
import type { Response } from 'express';

@Injectable()
export class CohortsService {
    private readonly logger = new Logger(CohortsService.name);

    private readonly masteringBitcoinDiscordRoleId: string;
    private readonly learningBitcoinFromCommandLineDiscordRoleId: string;
    private readonly programmingBitcoinDiscordRoleId: string;
    private readonly bitcoinProtocolDevelopmentDiscordRoleId: string;
    private readonly masteringLightningNetworkDiscordRoleId: string;
    private readonly rustForBitcoinDiscordRoleId: string;

    private readonly masteringBitcoinAlumniDiscordRoleId: string;
    private readonly learningBitcoinFromCommandLineAlumniDiscordRoleId: string;
    private readonly programmingBitcoinAlumniDiscordRoleId: string;
    private readonly bitcoinProtocolDevelopmentAlumniDiscordRoleId: string;
    private readonly masteringLightningNetworkAlumniDiscordRoleId: string;
    private readonly rustForBitcoinAlumniDiscordRoleId: string;

    constructor(
        @InjectRepository(Cohort)
        private readonly cohortRepository: Repository<Cohort>,
        @InjectRepository(CohortMembership)
        private readonly cohortMembershipRepository: Repository<CohortMembership>,
        @InjectRepository(CohortWeek)
        private readonly cohortWeekRepository: Repository<CohortWeek>,
        @InjectRepository(CohortWaitlist)
        private readonly cohortWaitlistRepository: Repository<CohortWaitlist>,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        @InjectRepository(Certificate)
        private readonly certificateRepository: Repository<Certificate>,
        @InjectRepository(APITask)
        private readonly apiTaskRepository: Repository<APITask<any>>,
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
        this.rustForBitcoinDiscordRoleId =
            this.configService.getOrThrow<string>(
                'discord.roles.rustForBitcoin',
            );

        this.masteringBitcoinAlumniDiscordRoleId =
            this.configService.getOrThrow<string>(
                'discord.roles.alumniMasteringBitcoin',
            );
        this.learningBitcoinFromCommandLineAlumniDiscordRoleId =
            this.configService.getOrThrow<string>(
                'discord.roles.alumniLearningBitcoinFromCommandLine',
            );
        this.programmingBitcoinAlumniDiscordRoleId =
            this.configService.getOrThrow<string>(
                'discord.roles.alumniProgrammingBitcoin',
            );
        this.bitcoinProtocolDevelopmentAlumniDiscordRoleId =
            this.configService.getOrThrow<string>(
                'discord.roles.alumniBitcoinProtocolDevelopment',
            );
        this.masteringLightningNetworkAlumniDiscordRoleId =
            this.configService.getOrThrow<string>(
                'discord.roles.alumniMasteringLightningNetwork',
            );
        this.rustForBitcoinAlumniDiscordRoleId =
            this.configService.getOrThrow<string>(
                'discord.roles.alumniRustForBitcoin',
            );
    }

    async getCohort(
        cohortId: string,
        role: UserRole,
    ): Promise<GetCohortResponseDto> {
        const cohort: Cohort | null = await this.cohortRepository.findOne({
            where: { id: cohortId },
            relations: { weeks: true },
        });

        if (!cohort) {
            throw new BadRequestException(
                `Cohort with id ${cohortId} does not exist.`,
            );
        }

        return GetCohortResponseDto.fromEntity(cohort, role);
    }

    async getAttachment(
        cohortId: string,
        filename: string,
        res: Response,
    ): Promise<StreamableFile> {
        const cohort = await this.cohortRepository.findOne({
            where: { id: cohortId },
            select: ['type'],
        });

        if (!cohort) {
            throw new NotFoundException(
                `Cohort with id ${cohortId} does not exist.`,
            );
        }

        // Prevent path traversal
        const sanitized = basename(filename);
        if (sanitized !== filename || filename.includes('\0')) {
            throw new BadRequestException('Invalid filename.');
        }

        const dir = cohort.type.toLowerCase().replace(/_/g, '-');
        const filePath = join(
            __dirname,
            '..',
            'assets',
            'cohort-configs',
            'attachments',
            dir,
            sanitized,
        );

        if (!existsSync(filePath)) {
            throw new NotFoundException('Attachment not found.');
        }

        const contentType = lookup(filePath) || 'application/octet-stream';
        res.set({ 'Content-Type': contentType });

        return new StreamableFile(createReadStream(filePath));
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
                            endDate: cohort.getEndDate().toISOString(),
                            registrationDeadline:
                                cohort.registrationDeadline.toISOString(),
                        }),
                )[0] || null
        );
    }

    async listCohorts(
        query: PaginatedQueryDto,
        role: UserRole,
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
            records: cohorts.map((cohort) =>
                GetCohortResponseDto.fromEntity(cohort, role),
            ),
        });
    }

    async listPublicCohorts(): Promise<ListAvailableCohortsResponseDto> {
        const latestCohorts = await this.cohortRepository
            .createQueryBuilder('c')
            .leftJoinAndSelect('c.weeks', 'weeks')
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
            [CohortType.RUST_FOR_BITCOIN]:
                this.mapLatestCohortsToPublicCohortResponseDto(
                    latestCohorts,
                    CohortType.RUST_FOR_BITCOIN,
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
                    memberships: { user: { id: user.id } },
                },
                skip: query.page * query.pageSize,
                take: query.pageSize,
                order: { createdAt: 'DESC' },
                relations: { weeks: true },
            });

        return new PaginatedDataDto({
            totalRecords: total,
            records: cohorts.map((cohort) =>
                GetCohortResponseDto.fromEntity(cohort, user.role),
            ),
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
                cohort.registrationDeadline = registrationDeadline;
                cohort.hasExercises = hasExercises;
                cohort.weeks = [];
                // Snapshot links from config at creation; editable per cohort.
                cohort.links = config.links.map((l) => ({
                    label: l.label,
                    url: l.url,
                    minRole: l.minRole,
                }));

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

                    const scheduledDate = new Date(startDate);
                    scheduledDate.setUTCDate(
                        scheduledDate.getUTCDate() + weekNumber * 7,
                    );
                    week.scheduledDate = scheduledDate;

                    if (weekNumber === 0) {
                        week.type = CohortWeekType.ORIENTATION;
                        week.hasExercise = false;
                        week.questions = [];
                        week.bonusQuestions = [];
                        week.title = null;
                        week.readingMaterial = [];
                        week.activity = null;
                        week.exercise = null;
                    } else if (weekNumber <= config.gdSessions) {
                        const weekConfig = config.weeks[weekNumber - 1];
                        week.type = CohortWeekType.GROUP_DISCUSSION;
                        week.hasExercise = weekConfig.hasExercise;
                        week.questions = weekConfig.questions.map((q) => ({
                            text: q.text,
                            attachments: q.attachments ?? [],
                        }));
                        week.bonusQuestions = weekConfig.bonusQuestions.map(
                            (q) => ({
                                text: q.text,
                                attachments: q.attachments ?? [],
                            }),
                        );
                        week.title = weekConfig.title ?? null;
                        week.readingMaterial = (
                            weekConfig.readingMaterial ?? []
                        ).map((r) => ({ label: r.label, url: r.url }));
                        week.activity = weekConfig.activity ?? null;
                        week.exercise = weekConfig.exercise
                            ? {
                                  title: weekConfig.exercise.title,
                                  concepts: weekConfig.exercise.concepts,
                                  problem: weekConfig.exercise.problem,
                                  expectedOutput:
                                      weekConfig.exercise.expectedOutput,
                              }
                            : null;
                    } else {
                        week.type = CohortWeekType.GRADUATION;
                        week.hasExercise = false;
                        week.questions = [];
                        week.bonusQuestions = [];
                        week.title = null;
                        week.readingMaterial = [];
                        week.activity = null;
                        week.exercise = null;
                    }

                    cohort.weeks.push(week);
                }

                await manager.save(cohort.weeks);

                // Create an initial sync task when cohort is created
                const apiTask = new APITask<TaskType.SYNC_CLASSROOM_SCORES>();
                apiTask.type = TaskType.SYNC_CLASSROOM_SCORES;
                apiTask.data = { cohortId: cohort.id };
                await manager.save(apiTask);

                // Start the daily Discord role reconciliation recurrence.
                // The handler self-reschedules at +24h after each run.
                const reconcileTask =
                    new APITask<TaskType.RECONCILE_COHORT_DISCORD_ROLES>();
                reconcileTask.type = TaskType.RECONCILE_COHORT_DISCORD_ROLES;
                reconcileTask.data = { cohortId: cohort.id };
                await manager.save(reconcileTask);

                // Schedule reminder email tasks for each week
                const reminderTasks = cohort.weeks.map((week) =>
                    this.createReminderTask(cohort.id, week),
                );
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
            relations: { weeks: true },
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
                // Shift all week scheduledDates by the same offset
                const offsetMs =
                    cohort.startDate.getTime() - originalStartDate.getTime();

                for (const week of cohort.weeks) {
                    week.scheduledDate = new Date(
                        week.scheduledDate.getTime() + offsetMs,
                    );
                }
                await manager.save(CohortWeek, cohort.weeks);

                // Cancel all unprocessed reminder tasks and recreate with new dates
                await manager
                    .createQueryBuilder()
                    .update(APITask)
                    .set({ status: APITaskStatus.CANCELLED })
                    .where('type = :type', {
                        type: TaskType.SEND_COHORT_REMINDER_EMAILS,
                    })
                    .andWhere('status = :status', {
                        status: APITaskStatus.UNPROCESSED,
                    })
                    .andWhere("data->>'cohortId' = :cohortId", { cohortId })
                    .execute();

                const reminderTasks = cohort.weeks.map((week) =>
                    this.createReminderTask(cohort.id, week),
                );
                await manager.save(APITask, reminderTasks);

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
                relations: { cohort: true },
            });

        if (!cohortWeek) {
            throw new BadRequestException(
                `Cohort week with id ${cohortWeekId} does not exist.`,
            );
        }

        if (cohortWeekData.classroomAssignmentId !== undefined) {
            cohortWeek.classroomAssignmentId =
                cohortWeekData.classroomAssignmentId;
        }

        let scheduledDateChanged = false;

        if (cohortWeekData.scheduledDate) {
            const scheduledDate = new Date(cohortWeekData.scheduledDate);
            scheduledDate.setUTCHours(0, 0, 0, 0);
            scheduledDateChanged =
                scheduledDate.getTime() !== cohortWeek.scheduledDate.getTime();
            cohortWeek.scheduledDate = scheduledDate;
        }

        await this.dbTransactionService.execute(async (manager) => {
            await manager.save(CohortWeek, cohortWeek);

            if (scheduledDateChanged) {
                // Cancel existing unprocessed reminder task for this week
                await manager
                    .createQueryBuilder()
                    .update(APITask)
                    .set({ status: APITaskStatus.CANCELLED })
                    .where('type = :type', {
                        type: TaskType.SEND_COHORT_REMINDER_EMAILS,
                    })
                    .andWhere('status = :status', {
                        status: APITaskStatus.UNPROCESSED,
                    })
                    .andWhere("data->>'cohortWeekId' = :cohortWeekId", {
                        cohortWeekId,
                    })
                    .execute();

                // Create new reminder task with updated date
                const reminderTask = this.createReminderTask(
                    cohortWeek.cohort.id,
                    cohortWeek,
                );
                await manager.save(APITask, reminderTask);

                // Send calendar update emails
                const calendarTask =
                    new APITask<TaskType.SEND_CALENDAR_UPDATE_EMAILS>();
                calendarTask.type = TaskType.SEND_CALENDAR_UPDATE_EMAILS;
                calendarTask.data = { cohortId: cohortWeek.cohort.id };
                await manager.save(APITask, calendarTask);
            }
        });
    }

    private createReminderTask(
        cohortId: string,
        week: CohortWeek,
    ): APITask<TaskType.SEND_COHORT_REMINDER_EMAILS> {
        const executeOnTime = new Date(week.scheduledDate);
        // 12:00 PM IST = 06:30 UTC
        executeOnTime.setUTCHours(6, 30, 0, 0);

        const task = new APITask<TaskType.SEND_COHORT_REMINDER_EMAILS>();
        task.type = TaskType.SEND_COHORT_REMINDER_EMAILS;
        task.data = { cohortId, cohortWeekId: week.id };
        task.executeOnTime = executeOnTime;
        return task;
    }

    /**
     * Destructively overwrites all config-backed instruction-sheet content from
     * the cohort's config: per GD week the questions, bonus questions, title,
     * reading material, activity and exercise; and the cohort's links. Non-GD
     * weeks have their content reset to empty. This is the ONLY way to update
     * cohort/cohort-week content. Scheduling (dates), classroom assignment, and
     * the structural hasExercise/classroomId flags are NOT touched.
     */
    async syncFromConfig(cohortId: string): Promise<void> {
        const cohort = await this.cohortRepository.findOne({
            where: { id: cohortId },
            relations: { weeks: true },
        });

        if (!cohort) {
            throw new BadRequestException(
                `Cohort with id ${cohortId} does not exist.`,
            );
        }

        const config = this.cohortConfigService.getConfig(cohort.type);

        for (const week of cohort.weeks) {
            if (week.type === CohortWeekType.GROUP_DISCUSSION) {
                const weekConfig = config.weeks[week.week - 1];
                if (!weekConfig) continue;

                week.questions = weekConfig.questions.map((q) => ({
                    text: q.text,
                    attachments: q.attachments ?? [],
                }));
                week.bonusQuestions = weekConfig.bonusQuestions.map((q) => ({
                    text: q.text,
                    attachments: q.attachments ?? [],
                }));
                week.title = weekConfig.title;
                week.readingMaterial = weekConfig.readingMaterial.map((r) => ({
                    label: r.label,
                    url: r.url,
                }));
                week.activity = weekConfig.activity ?? null;
                week.exercise = weekConfig.exercise
                    ? {
                          title: weekConfig.exercise.title,
                          concepts: weekConfig.exercise.concepts,
                          problem: weekConfig.exercise.problem,
                          expectedOutput: weekConfig.exercise.expectedOutput,
                      }
                    : null;
            } else {
                week.questions = [];
                week.bonusQuestions = [];
                week.title = null;
                week.readingMaterial = [];
                week.activity = null;
                week.exercise = null;
            }
        }

        cohort.links = config.links.map((l) => ({
            label: l.label,
            url: l.url,
            minRole: l.minRole,
        }));

        await this.dbTransactionService.execute(async (manager) => {
            await manager.save(Cohort, cohort);
            await manager.save(CohortWeek, cohort.weeks);
        });
    }

    private getDiscordRoleIdForCohortType(cohortType: CohortType): string {
        switch (cohortType) {
            case CohortType.MASTERING_BITCOIN:
                return this.masteringBitcoinDiscordRoleId;
            case CohortType.LEARNING_BITCOIN_FROM_COMMAND_LINE:
                return this.learningBitcoinFromCommandLineDiscordRoleId;
            case CohortType.PROGRAMMING_BITCOIN:
                return this.programmingBitcoinDiscordRoleId;
            case CohortType.BITCOIN_PROTOCOL_DEVELOPMENT:
                return this.bitcoinProtocolDevelopmentDiscordRoleId;
            case CohortType.MASTERING_LIGHTNING_NETWORK:
                return this.masteringLightningNetworkDiscordRoleId;
            case CohortType.RUST_FOR_BITCOIN:
                return this.rustForBitcoinDiscordRoleId;
            default:
                throw new BadRequestException(
                    `Invalid cohort type: ${cohortType}`,
                );
        }
    }

    private getAlumniDiscordRoleIdForCohortType(
        cohortType: CohortType,
    ): string {
        switch (cohortType) {
            case CohortType.MASTERING_BITCOIN:
                return this.masteringBitcoinAlumniDiscordRoleId;
            case CohortType.LEARNING_BITCOIN_FROM_COMMAND_LINE:
                return this.learningBitcoinFromCommandLineAlumniDiscordRoleId;
            case CohortType.PROGRAMMING_BITCOIN:
                return this.programmingBitcoinAlumniDiscordRoleId;
            case CohortType.BITCOIN_PROTOCOL_DEVELOPMENT:
                return this.bitcoinProtocolDevelopmentAlumniDiscordRoleId;
            case CohortType.MASTERING_LIGHTNING_NETWORK:
                return this.masteringLightningNetworkAlumniDiscordRoleId;
            case CohortType.RUST_FOR_BITCOIN:
                return this.rustForBitcoinAlumniDiscordRoleId;
            default:
                throw new BadRequestException(
                    `Invalid cohort type: ${cohortType}`,
                );
        }
    }

    async assignDiscordRole(userId: string, cohortId: string) {
        const membership = await this.cohortMembershipRepository.findOne({
            where: { user: { id: userId }, cohort: { id: cohortId } },
            relations: { user: true, cohort: true },
        });

        if (!membership) {
            throw new BadRequestException(
                `User ${userId} is not enrolled in cohort ${cohortId}.`,
            );
        }

        const { user, cohort } = membership;
        const roleId = this.getDiscordRoleIdForCohortType(cohort.type);

        if (!user.isGuildMember) {
            throw new BadRequestException(
                `User is not a member of the Discord guild.`,
            );
        }

        await this.discordClient.attachRoleToMember(user.discordUserId, roleId);

        membership.discordRoleAssigned = true;
        await this.cohortMembershipRepository.save(membership);
    }

    async handleAssignAlumniRolesTask(
        task: APITask<TaskType.ASSIGN_COHORT_ALUMNI_ROLE>,
    ): Promise<void> {
        const { cohortId } = task.data;

        const cohort = await this.cohortRepository.findOne({
            where: { id: cohortId },
        });

        if (!cohort) {
            this.logger.warn(
                `Cohort ${cohortId} not found, skipping alumni role assignment`,
            );
            return;
        }

        await this.reconcileAlumniDiscordRolesForCohort(cohort);
    }

    async handleReconcileDiscordRolesTask(
        task: APITask<TaskType.RECONCILE_COHORT_DISCORD_ROLES>,
    ): Promise<void> {
        const { cohortId } = task.data;

        const cohort = await this.cohortRepository.findOne({
            where: { id: cohortId },
            relations: { weeks: true },
        });

        if (!cohort) {
            // Cohort deleted; stop the recurrence by not rescheduling.
            this.logger.warn(
                `Cohort ${cohortId} not found, stopping reconciliation recurrence`,
            );
            return;
        }

        const reconciliationCutoff =
            cohort.getEndDate().getTime() + 7 * TWENTY_FOUR_HOURS_MS;
        const shouldRequeue = Date.now() < reconciliationCutoff;

        try {
            await this.reconcileDiscordRolesForCohort(cohort);
            if (shouldRequeue) {
                await this.scheduleNextReconciliation(cohortId);
            } else {
                this.logger.log(
                    `Cohort ${cohortId} ended over a week ago, stopping reconciliation recurrence`,
                );
            }
        } catch (error) {
            if (isLastRetry(task) && shouldRequeue) {
                await this.scheduleNextReconciliation(cohortId);
            }
            throw error;
        }
    }

    private async scheduleNextReconciliation(cohortId: string): Promise<void> {
        const next = this.apiTaskRepository.create({
            type: TaskType.RECONCILE_COHORT_DISCORD_ROLES,
            data: { cohortId },
            executeOnTime: new Date(Date.now() + TWENTY_FOUR_HOURS_MS),
        });
        await this.apiTaskRepository.save(next);
    }

    private async reconcileDiscordRolesForCohort(
        cohort: Cohort,
    ): Promise<void> {
        const roleId = this.getDiscordRoleIdForCohortType(cohort.type);

        const memberships = await this.cohortMembershipRepository.find({
            where: { cohort: { id: cohort.id }, discordRoleAssigned: false },
            relations: { user: true },
        });

        this.logger.log(
            `Reconciling Discord roles for ${memberships.length} membership(s) in cohort ${cohort.id}`,
        );

        for (const membership of memberships) {
            const { user } = membership;
            try {
                const guildMember = await this.discordClient.getGuildMember(
                    user.discordUserId,
                );
                if (!guildMember.roles.includes(roleId)) {
                    await this.discordClient.attachRoleToMember(
                        user.discordUserId,
                        roleId,
                    );
                }
                membership.discordRoleAssigned = true;
                await this.cohortMembershipRepository.save(membership);
            } catch (error) {
                this.logger.warn(
                    `Failed to reconcile Discord role for user ${user.id} in cohort ${cohort.id}: ${error.message}`,
                );
            }
        }

        await this.reconcileAlumniDiscordRolesForCohort(cohort);
    }

    private async reconcileAlumniDiscordRolesForCohort(
        cohort: Cohort,
    ): Promise<void> {
        const alumniRoleId = this.getAlumniDiscordRoleIdForCohortType(
            cohort.type,
        );

        const certificates = await this.certificateRepository.find({
            where: { cohort: { id: cohort.id } },
            relations: { user: true },
        });

        if (certificates.length === 0) {
            return;
        }

        const memberships = await this.cohortMembershipRepository.find({
            where: {
                cohort: { id: cohort.id },
                user: { id: In(certificates.map((c) => c.user.id)) },
                alumniRoleAssigned: false,
            },
            relations: { user: true },
        });

        this.logger.log(
            `Reconciling alumni Discord roles for ${memberships.length} membership(s) in cohort ${cohort.id}`,
        );

        for (const membership of memberships) {
            const { user } = membership;
            try {
                const guildMember = await this.discordClient.getGuildMember(
                    user.discordUserId,
                );
                if (!guildMember.roles.includes(alumniRoleId)) {
                    await this.discordClient.attachRoleToMember(
                        user.discordUserId,
                        alumniRoleId,
                    );
                }
                membership.alumniRoleAssigned = true;
                await this.cohortMembershipRepository.save(membership);
            } catch (error) {
                this.logger.warn(
                    `Failed to reconcile alumni Discord role for user ${user.id} in cohort ${cohort.id}: ${error.message}`,
                );
            }
        }
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
            relations: { weeks: true },
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

        const alreadyEnrolled = await this.cohortMembershipRepository.exists({
            where: { user: { id: user.id }, cohort: { id: cohort.id } },
        });

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
                const membership = new CohortMembership();
                membership.user = user;
                membership.cohort = cohort;
                membership.discordRoleAssigned = false;
                await manager.save(membership);

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
                    cohortId: cohort.id,
                };
                await manager.save(apiTask);
            },
        );

        // Send cohort joining confirmation email with calendar invite
        try {
            const calendarInvite =
                await this.cohortCalendarService.generateCalendarInvite(
                    cohortId,
                );
            await this.mailService.sendCohortJoiningConfirmationEmail(
                user.email,
                user.displayName,
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
        });

        if (!cohort) {
            throw new BadRequestException(
                `Cohort with id ${cohortId} does not exist.`,
            );
        }

        const isEnrolled = await this.cohortMembershipRepository.exists({
            where: { user: { id: user.id }, cohort: { id: cohort.id } },
        });

        if (!isEnrolled) {
            throw new BadRequestException('User is not enrolled in cohort.');
        }

        await this.dbTransactionService.execute(
            async (manager): Promise<void> => {
                await manager.delete(CohortMembership, {
                    user: { id: user.id },
                    cohort: { id: cohort.id },
                });

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
                user.displayName,
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
