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
    UserCohortWaitlistResponseDto,
} from '@/cohorts/cohorts.response.dto';
import { PaginatedDataDto, PaginatedQueryDto } from '@/common/dto';
import { User } from '@/entities/user.entity';
import { GroupDiscussionScore } from '@/entities/group-discussion-score.entity';
import { ExerciseScore } from '@/entities/exercise-score.entity';
import { DiscordClient } from '@/discord-client/discord.client';
import { ConfigService } from '@nestjs/config';
import { CohortType } from '@/common/enum';
import { CohortWaitlist } from '@/entities/cohort-waitlist.entity';
import { APITask } from '@/entities/api-task.entity';
import { TaskType } from '@/task-processor/task.enums';
import { MailService } from '@/mail/mail.service';

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
        @InjectRepository(APITask)
        private readonly apiTaskRepository: Repository<APITask<any>>,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        private readonly dbTransactionService: DbTransactionService,
        private readonly discordClient: DiscordClient,
        private readonly configService: ConfigService,
        private readonly mailService: MailService,
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

        return new GetCohortResponseDto({
            id: cohort.id,
            type: cohort.type,
            season: cohort.season,
            startDate: cohort.startDate.toISOString(),
            endDate: cohort.endDate.toISOString(),
            registrationDeadline: cohort.registrationDeadline.toISOString(),
            weeks: cohort.weeks.map((week) => ({
                id: week.id,
                week: week.week,
                questions: week.questions || [],
                bonusQuestion: week.bonusQuestion || [],
                classroomUrl: week.classroomUrl || null,
                classroomInviteLink: week.classroomInviteLink || null,
            })),
        });
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
            records: cohorts.map(
                (cohort) =>
                    new GetCohortResponseDto({
                        id: cohort.id,
                        type: cohort.type,
                        season: cohort.season,
                        startDate: cohort.startDate.toISOString(),
                        endDate: cohort.endDate.toISOString(),
                        registrationDeadline:
                            cohort.registrationDeadline.toISOString(),
                        weeks: cohort.weeks.map((week) => ({
                            id: week.id,
                            week: week.week,
                            questions: week.questions || [],
                            bonusQuestion: week.bonusQuestion || [],
                            classroomUrl: week.classroomUrl || null,
                            classroomInviteLink:
                                week.classroomInviteLink || null,
                        })),
                    }),
            ),
        });
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
            records: cohorts.map(
                (cohort) =>
                    new GetCohortResponseDto({
                        id: cohort.id,
                        type: cohort.type,
                        season: cohort.season,
                        startDate: cohort.startDate.toISOString(),
                        endDate: cohort.endDate.toISOString(),
                        registrationDeadline:
                            cohort.registrationDeadline.toISOString(),
                        weeks: cohort.weeks.map((week) => ({
                            id: week.id,
                            week: week.week,
                            questions: week.questions || [],
                            bonusQuestion: week.bonusQuestion || [],
                            classroomUrl: week.classroomUrl || null,
                            classroomInviteLink:
                                week.classroomInviteLink || null,
                        })),
                    }),
            ),
        });
    }

    async createCohort(cohortData: CreateCohortRequestDto): Promise<void> {
        await this.dbTransactionService.execute(
            async (manager): Promise<void> => {
                const cohortAlreadyExists: boolean = await manager.exists(
                    Cohort,
                    {
                        where: {
                            type: cohortData.type,
                            season: cohortData.season,
                        },
                    },
                );

                if (cohortAlreadyExists) {
                    throw new BadRequestException(
                        `Cohort of type ${cohortData.type} and season ${cohortData.season} already exists.`,
                    );
                }
                const startDate = new Date(cohortData.startDate);
                startDate.setUTCHours(0, 0, 0, 0);
                const registrationDeadline = new Date(
                    cohortData.registrationDeadline,
                );
                registrationDeadline.setUTCHours(0, 0, 0, 0);
                const endDate = new Date(cohortData.endDate + 'T00:00:00Z');
                endDate.setUTCHours(0, 0, 0, 0);

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

                const cohort = new Cohort();
                cohort.id = randomUUID();
                cohort.type = cohortData.type;
                cohort.season = cohortData.season;
                cohort.startDate = startDate;
                cohort.endDate = endDate;
                cohort.registrationDeadline = registrationDeadline;
                cohort.weeks = [];

                await manager.save(cohort);

                for (
                    let weekNumber = 0;
                    weekNumber <= cohortData.weeks;
                    weekNumber++
                ) {
                    const week: CohortWeek = new CohortWeek();
                    week.id = randomUUID();
                    week.week = weekNumber;
                    week.cohort = cohort;
                    cohort.weeks.push(week);
                }

                await manager.save(cohort.weeks);
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

        if (cohortData.startDate) {
            const startDate = new Date(cohortData.startDate);
            startDate.setUTCHours(0, 0, 0, 0);
            cohort.startDate = startDate;
        }
        if (cohortData.endDate) {
            const endDate = new Date(cohortData.endDate);
            endDate.setUTCHours(0, 0, 0, 0);
            cohort.endDate = endDate;
        }
        if (cohortData.registrationDeadline) {
            const registrationDeadline = new Date(
                cohortData.registrationDeadline,
            );
            registrationDeadline.setUTCHours(0, 0, 0, 0);
            cohort.registrationDeadline = registrationDeadline;
        }

        await this.cohortRepository.save(cohort);
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
        if (cohortWeekData.classroomUrl) {
            cohortWeek.classroomUrl = cohortWeekData.classroomUrl;
        }
        if (cohortWeekData.classroomInviteLink) {
            cohortWeek.classroomInviteLink = cohortWeekData.classroomInviteLink;
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

                const groupDiscussionScores: GroupDiscussionScore[] = [];
                const exerciseScores: ExerciseScore[] = [];

                for (const week of cohort.weeks) {
                    const groupDiscussionScore = new GroupDiscussionScore();
                    groupDiscussionScore.user = user;
                    groupDiscussionScore.cohort = cohort;
                    groupDiscussionScore.cohortWeek = week;

                    groupDiscussionScores.push(groupDiscussionScore);

                    const exerciseScore = new ExerciseScore();
                    exerciseScore.user = user;
                    exerciseScore.cohort = cohort;
                    exerciseScore.cohortWeek = week;

                    exerciseScores.push(exerciseScore);
                }

                await manager.save(groupDiscussionScores);
                await manager.save(exerciseScores);

                if (waitlistEntry) await manager.remove(waitlistEntry);

                const apiTask = new APITask<TaskType.ASSIGN_COHORT_ROLE>();
                apiTask.type = TaskType.ASSIGN_COHORT_ROLE;
                apiTask.data = {
                    userId: user.id,
                    cohortType: cohort.type,
                };
                await this.apiTaskRepository.save(apiTask);
            },
        );

        // Send cohort joining confirmation email
        const userName =
            user.name || user.discordGlobalName || user.discordUserName;

        try {
            await this.mailService.sendCohortJoiningConfirmationEmail(
                user.email,
                userName,
                cohort.type,
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
