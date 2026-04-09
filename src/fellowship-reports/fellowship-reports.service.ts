import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    Logger,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { FellowshipReport } from '@/entities/fellowship-report.entity';
import { Fellowship } from '@/entities/fellowship.entity';
import { User } from '@/entities/user.entity';
import {
    FellowshipReportStatus,
    FellowshipStatus,
    UserRole,
} from '@/common/enum';
import {
    CreateFellowshipReportRequestDto,
    ReviewFellowshipReportRequestDto,
    UpdateFellowshipReportRequestDto,
} from '@/fellowship-reports/fellowship-reports.request.dto';
import {
    FellowshipReportContentResponseDto,
    FellowshipReportResponseDto,
} from '@/fellowship-reports/fellowship-reports.response.dto';
import { PaginatedDataDto, PaginatedQueryDto } from '@/common/dto';
import { MailService } from '@/mail/mail.service';
import { APITask } from '@/entities/api-task.entity';

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
        query: PaginatedQueryDto,
        status?: FellowshipReportStatus,
        month?: number,
        year?: number,
    ): Promise<PaginatedDataDto<FellowshipReportResponseDto>> {
        const [records, totalRecords] =
            await this.reportRepository.findAndCount({
                where: {
                    ...(status
                        ? { status }
                        : { status: Not(FellowshipReportStatus.DRAFT) }),
                    ...(month && { month }),
                    ...(year && { year }),
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
}
