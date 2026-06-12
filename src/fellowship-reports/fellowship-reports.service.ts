import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    Logger,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, In, Repository } from 'typeorm';
import { FellowshipReport } from '@/entities/fellowship-report.entity';
import { Fellowship } from '@/entities/fellowship.entity';
import { User } from '@/entities/user.entity';
import {
    FellowshipReportStatus,
    FellowshipStatus,
    SortOrder,
    UserRole,
} from '@/common/enum';
import {
    CreateFellowshipReportRequestDto,
    FellowshipReportSortBy,
    ListFellowshipReportsQueryDto,
    ReviewFellowshipReportRequestDto,
    UpdateFellowshipReportRequestDto,
} from '@/fellowship-reports/fellowship-reports.request.dto';
import {
    FellowshipReportContentResponseDto,
    FellowshipReportResponseDto,
} from '@/fellowship-reports/fellowship-reports.response.dto';
import { PaginatedDataDto, PaginatedQueryDto } from '@/common/dto';
import { escapeLikePattern } from '@/common/common';
import { MailService } from '@/mail/mail.service';
import { APITask } from '@/entities/api-task.entity';
import { TaskType } from '@/task-processor/task.enums';
import { isLastRetry } from '@/task-processor/task-processor.utils';

const REPORT_SORT_COLUMNS: Record<
    Exclude<FellowshipReportSortBy, FellowshipReportSortBy.PERIOD>,
    string
> = {
    [FellowshipReportSortBy.CREATED_AT]: 'report.createdAt',
    [FellowshipReportSortBy.UPDATED_AT]: 'report.updatedAt',
};

@Injectable()
export class FellowshipReportsService {
    private readonly logger = new Logger(FellowshipReportsService.name);

    constructor(
        @InjectRepository(FellowshipReport)
        private readonly reportRepository: Repository<FellowshipReport>,
        @InjectRepository(Fellowship)
        private readonly fellowshipRepository: Repository<Fellowship>,
        @InjectRepository(APITask)
        private readonly apiTaskRepository: Repository<APITask<any>>,
        private readonly mailService: MailService,
    ) {}

    async createReport(
        user: User,
        dto: CreateFellowshipReportRequestDto,
    ): Promise<FellowshipReportResponseDto> {
        const fellowship = await this.fellowshipRepository.findOne({
            where: { id: dto.fellowshipId },
            relations: { user: true },
        });

        if (!fellowship) {
            throw new NotFoundException('Fellowship not found');
        }

        if (fellowship.user.id !== user.id) {
            throw new ForbiddenException();
        }

        if (fellowship.status !== FellowshipStatus.ACTIVE) {
            throw new BadRequestException(
                'Reports can only be created for active fellowships',
            );
        }

        const report = this.reportRepository.create({
            month: dto.month,
            year: dto.year,
            content: dto.content,
            status: FellowshipReportStatus.DRAFT,
            fellowship: fellowship,
        });

        const saved = await this.reportRepository.save(report);

        const result = await this.reportRepository.findOneOrFail({
            where: { id: saved.id },
            relations: {
                fellowship: { user: true },
                reviewedBy: true,
            },
        });

        return FellowshipReportResponseDto.fromEntity(result);
    }

    async updateDraft(
        id: string,
        user: User,
        dto: UpdateFellowshipReportRequestDto,
    ): Promise<FellowshipReportResponseDto> {
        const report = await this.reportRepository.findOne({
            where: { id },
            relations: {
                fellowship: { user: true },
                reviewedBy: true,
            },
        });

        if (!report) {
            throw new NotFoundException('Report not found');
        }

        if (report.fellowship.user.id !== user.id) {
            throw new ForbiddenException();
        }

        if (report.status !== FellowshipReportStatus.DRAFT) {
            throw new BadRequestException('Only draft reports can be updated');
        }

        if (dto.content !== undefined) {
            report.content = dto.content;
        }

        await this.reportRepository.save(report);

        return FellowshipReportResponseDto.fromEntity(report);
    }

    async submitDraft(
        id: string,
        user: User,
    ): Promise<FellowshipReportResponseDto> {
        const report = await this.reportRepository.findOne({
            where: { id },
            relations: {
                fellowship: { user: true },
                reviewedBy: true,
            },
        });

        if (!report) {
            throw new NotFoundException('Report not found');
        }

        if (report.fellowship.user.id !== user.id) {
            throw new ForbiddenException();
        }

        if (report.status !== FellowshipReportStatus.DRAFT) {
            throw new BadRequestException(
                'Only draft reports can be submitted',
            );
        }

        report.status = FellowshipReportStatus.SUBMITTED;
        await this.reportRepository.save(report);

        return FellowshipReportResponseDto.fromEntity(report);
    }

    async deleteDraft(id: string, user: User): Promise<void> {
        const report = await this.reportRepository.findOne({
            where: { id },
            relations: { fellowship: { user: true } },
        });

        if (!report) {
            throw new NotFoundException('Report not found');
        }

        if (report.fellowship.user.id !== user.id) {
            throw new ForbiddenException();
        }

        if (report.status !== FellowshipReportStatus.DRAFT) {
            throw new BadRequestException('Only draft reports can be deleted');
        }

        await this.reportRepository.remove(report);
    }

    async getMyReports(
        user: User,
        query: PaginatedQueryDto,
        month?: number,
        year?: number,
        status?: FellowshipReportStatus,
    ): Promise<PaginatedDataDto<FellowshipReportResponseDto>> {
        const [records, totalRecords] =
            await this.reportRepository.findAndCount({
                where: {
                    fellowship: { user: { id: user.id } },
                    ...(month && { month }),
                    ...(year && { year }),
                    ...(status && { status }),
                },
                relations: {
                    fellowship: { user: true },
                    reviewedBy: true,
                },
                order: { createdAt: 'DESC' },
                skip: query.page * query.pageSize,
                take: query.pageSize,
            });

        return new PaginatedDataDto({
            totalRecords,
            records: records.map(FellowshipReportResponseDto.fromEntity),
        });
    }

    async getReportContent(
        id: string,
        user: User,
    ): Promise<FellowshipReportContentResponseDto> {
        const report = await this.reportRepository.findOne({
            where: { id },
            relations: { fellowship: { user: true } },
        });

        if (!report) {
            throw new NotFoundException('Report not found');
        }

        if (
            report.fellowship.user.id !== user.id &&
            user.role !== UserRole.ADMIN
        ) {
            throw new ForbiddenException();
        }

        return new FellowshipReportContentResponseDto(report.content);
    }

    async getReportById(
        id: string,
        user: User,
    ): Promise<FellowshipReportResponseDto> {
        const report = await this.reportRepository.findOne({
            where: { id },
            relations: {
                fellowship: { user: true },
                reviewedBy: true,
            },
        });

        if (!report) {
            throw new NotFoundException('Report not found');
        }

        if (
            report.fellowship.user.id !== user.id &&
            user.role !== UserRole.ADMIN
        ) {
            throw new ForbiddenException();
        }

        return FellowshipReportResponseDto.fromEntity(report);
    }

    async listReports(
        query: ListFellowshipReportsQueryDto,
    ): Promise<PaginatedDataDto<FellowshipReportResponseDto>> {
        const qb = this.reportRepository
            .createQueryBuilder('report')
            .leftJoinAndSelect('report.fellowship', 'fellowship')
            .leftJoinAndSelect('fellowship.user', 'fellow')
            .leftJoinAndSelect('report.reviewedBy', 'reviewedBy');

        if (query.status) {
            qb.andWhere('report.status = :status', { status: query.status });
        } else {
            qb.andWhere('report.status != :draftStatus', {
                draftStatus: FellowshipReportStatus.DRAFT,
            });
        }

        if (query.month) {
            qb.andWhere('report.month = :month', { month: query.month });
        }

        if (query.year) {
            qb.andWhere('report.year = :year', { year: query.year });
        }

        if (query.type) {
            qb.andWhere('fellowship.type = :type', { type: query.type });
        }

        if (query.fellowshipId) {
            qb.andWhere('fellowship.id = :fellowshipId', {
                fellowshipId: query.fellowshipId,
            });
        }

        if (query.search) {
            qb.andWhere(
                new Brackets((w) =>
                    w
                        .where('fellowship.projectName ILIKE :search')
                        .orWhere('fellow.name ILIKE :search')
                        .orWhere('fellow.discordUserName ILIKE :search')
                        .orWhere('fellow.discordGlobalName ILIKE :search')
                        .orWhere('fellow.email ILIKE :search'),
                ),
                { search: `%${escapeLikePattern(query.search)}%` },
            );
        }

        const order = query.sortOrder === SortOrder.ASC ? 'ASC' : 'DESC';

        if (query.sortBy === FellowshipReportSortBy.PERIOD) {
            qb.orderBy('report.year', order).addOrderBy('report.month', order);
        } else {
            qb.orderBy(REPORT_SORT_COLUMNS[query.sortBy], order);
        }

        const [records, totalRecords] = await qb
            .addOrderBy('report.id', 'ASC')
            .skip(query.page * query.pageSize)
            .take(query.pageSize)
            .getManyAndCount();

        return new PaginatedDataDto({
            totalRecords,
            records: records.map(FellowshipReportResponseDto.fromEntity),
        });
    }

    async reviewReport(
        id: string,
        reviewer: User,
        dto: ReviewFellowshipReportRequestDto,
    ): Promise<FellowshipReportResponseDto> {
        const report = await this.reportRepository.findOne({
            where: { id },
            relations: {
                fellowship: { user: true },
                reviewedBy: true,
            },
        });

        if (!report) {
            throw new NotFoundException('Report not found');
        }

        if (report.status !== FellowshipReportStatus.SUBMITTED) {
            throw new BadRequestException(
                report.status === FellowshipReportStatus.DRAFT
                    ? 'Cannot review a draft report'
                    : `Report has already been ${report.status.toLowerCase()}`,
            );
        }

        if (
            dto.status === FellowshipReportStatus.REJECTED &&
            !dto.reviewerRemarks
        ) {
            throw new BadRequestException(
                'Reviewer remarks are required when rejecting a report',
            );
        }

        report.status = dto.status;
        report.reviewedBy = reviewer;
        if (dto.reviewerRemarks) {
            report.reviewerRemarks = dto.reviewerRemarks;
        }

        await this.reportRepository.save(report);

        const fellowUser = report.fellowship.user;
        if (fellowUser.email) {
            try {
                if (dto.status === FellowshipReportStatus.APPROVED) {
                    await this.mailService.sendFellowshipReportApprovedEmail(
                        fellowUser.email,
                        fellowUser.displayName,
                        report.month,
                        report.year,
                    );
                } else if (dto.status === FellowshipReportStatus.REJECTED) {
                    await this.mailService.sendFellowshipReportRejectedEmail(
                        fellowUser.email,
                        fellowUser.displayName,
                        report.month,
                        report.year,
                        dto.reviewerRemarks ??
                            'No additional feedback provided by the reviewer.',
                    );
                }
            } catch (err) {
                this.logger.error(
                    `Failed to send report review email to ${fellowUser.email}`,
                    (err as Error).stack,
                );
            }
        }

        return FellowshipReportResponseDto.fromEntity(report);
    }

    async handleSendReportReminderEmails(
        task: APITask<TaskType.SEND_FELLOWSHIP_REPORT_REMINDER_EMAILS>,
    ): Promise<void> {
        const { month, year } = task.data;

        try {
            const activeFellowships = await this.fellowshipRepository.find({
                where: { status: FellowshipStatus.ACTIVE },
                relations: { user: true },
            });

            for (const fellowship of activeFellowships) {
                try {
                    const hasSubmitted = await this.reportRepository.exists({
                        where: {
                            fellowship: { id: fellowship.id },
                            month,
                            year,
                            status: In([
                                FellowshipReportStatus.SUBMITTED,
                                FellowshipReportStatus.APPROVED,
                            ]),
                        },
                    });

                    if (hasSubmitted) {
                        continue;
                    }

                    const user = fellowship.user;
                    if (user.email) {
                        await this.mailService.sendFellowshipReportReminderEmail(
                            user.email,
                            user.displayName,
                            month,
                            year,
                        );
                    }
                } catch (error) {
                    this.logger.error(
                        `Failed to send report reminder email to ${fellowship.user.email}: ${error?.message}`,
                        error?.stack,
                    );
                }
            }

            await this.scheduleNextReportReminder(task);
        } catch (error) {
            this.logger.error(
                `Failed to send fellowship report reminder emails: ${error?.message}`,
                error?.stack,
            );

            if (isLastRetry(task)) {
                await this.scheduleNextReportReminder(task);
            }

            throw error;
        }
    }

    private async scheduleNextReportReminder(
        task: APITask<TaskType.SEND_FELLOWSHIP_REPORT_REMINDER_EMAILS>,
    ): Promise<void> {
        const { month, year } = task.data;
        const executeOnDay = task.executeOnTime.getUTCDate();
        let nextExecuteOnTime: Date;
        let nextMonth = month;
        let nextYear = year;

        if (executeOnDay < 25) {
            nextExecuteOnTime = new Date(
                Date.UTC(year, month - 1, 25, 6, 30, 0),
            );
        } else if (executeOnDay < 28) {
            nextExecuteOnTime = new Date(
                Date.UTC(year, month - 1, 28, 6, 30, 0),
            );
        } else {
            nextMonth = month === 12 ? 1 : month + 1;
            nextYear = month === 12 ? year + 1 : year;
            nextExecuteOnTime = new Date(
                Date.UTC(nextYear, nextMonth - 1, 20, 6, 30, 0),
            );
        }

        const nextTask =
            new APITask<TaskType.SEND_FELLOWSHIP_REPORT_REMINDER_EMAILS>();
        nextTask.type = TaskType.SEND_FELLOWSHIP_REPORT_REMINDER_EMAILS;
        nextTask.data = { month: nextMonth, year: nextYear };
        nextTask.executeOnTime = nextExecuteOnTime;
        nextTask.retryLimit = 1;
        await this.apiTaskRepository.save(nextTask);
    }
}
