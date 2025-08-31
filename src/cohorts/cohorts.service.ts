import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cohort } from '@/entities/cohort.entity';
import { Repository } from 'typeorm';
import {
    CreateCohortRequestDto,
    UpdateCohortRequestDto,
    UpdateCohortWeekRequestDto,
} from '@/cohorts/cohorts.request.dto';
import { DbTransactionService } from '@/db-transaction/db-transaction.service';
import { CohortWeek } from '@/entities/cohort-week.entity';
import { randomUUID } from 'crypto';
import { GetCohortResponseDto } from '@/cohorts/cohorts.response.dto';
import { PaginatedDataDto, PaginatedQueryDto } from '@/common/dto';

@Injectable()
export class CohortsService {
    constructor(
        @InjectRepository(Cohort)
        private readonly cohortRepository: Repository<Cohort>,
        @InjectRepository(CohortWeek)
        private readonly cohortWeekRepository: Repository<CohortWeek>,
        private readonly dbTransactionService: DbTransactionService,
    ) {}

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

    private async convertDateToTimestamp(dateString: string): Promise<Date> {
        return new Date(dateString);
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
}
