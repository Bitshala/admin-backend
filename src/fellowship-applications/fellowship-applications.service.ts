import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    Logger,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, In, Repository } from 'typeorm';
import { FellowshipApplication } from '@/entities/fellowship-application.entity';
import { Fellowship } from '@/entities/fellowship.entity';
import { User } from '@/entities/user.entity';
import {
    FellowshipApplicationStatus,
    SortOrder,
    UserRole,
} from '@/common/enum';
import {
    CreateFellowshipApplicationRequestDto,
    FellowshipApplicationSortBy,
    ListFellowshipApplicationsQueryDto,
    ReviewFellowshipApplicationRequestDto,
    UpdateFellowshipApplicationRequestDto,
} from '@/fellowship-applications/fellowship-applications.request.dto';
import {
    FellowshipApplicationProposalResponseDto,
    FellowshipApplicationResponseDto,
} from '@/fellowship-applications/fellowship-applications.response.dto';
import { PaginatedDataDto, PaginatedQueryDto } from '@/common/dto';
import { escapeLikePattern } from '@/common/common';
import { GitHubClassroomClient } from '@/github-classroom/client/github-classroom.client';
import { MailService } from '@/mail/mail.service';

const GITHUB_USERNAME_RE = /^[A-Za-z0-9](?:[A-Za-z0-9-]){0,38}$/;

const APPLICATION_SORT_COLUMNS: Record<FellowshipApplicationSortBy, string> = {
    [FellowshipApplicationSortBy.CREATED_AT]: 'application.createdAt',
    [FellowshipApplicationSortBy.UPDATED_AT]: 'application.updatedAt',
};

@Injectable()
export class FellowshipApplicationsService {
    private readonly logger = new Logger(FellowshipApplicationsService.name);

    constructor(
        @InjectRepository(FellowshipApplication)
        private readonly applicationRepository: Repository<FellowshipApplication>,
        @InjectRepository(Fellowship)
        private readonly fellowshipRepository: Repository<Fellowship>,
        private readonly mailService: MailService,
        private readonly githubClient: GitHubClassroomClient,
    ) {}

    /**
     * Advisory GitHub account check used by the application form.
     * Returns `exists: null` when GitHub could not be reached (rate limit,
     * network) — callers must treat that as "unknown", never as "missing".
     */
    async checkGithubUser(username: string): Promise<boolean | null> {
        if (!GITHUB_USERNAME_RE.test(username)) return false;
        try {
            return await this.githubClient.userExists(username);
        } catch (err) {
            this.logger.warn(
                `GitHub user check failed for "${username}": ${
                    (err as Error).message
                }`,
            );
            return null;
        }
    }

    async createApplication(
        user: User,
        dto: CreateFellowshipApplicationRequestDto,
    ): Promise<FellowshipApplicationResponseDto> {
        const existingActive = await this.applicationRepository.exists({
            where: {
                applicant: { id: user.id },
                type: dto.type,
                status: In([
                    FellowshipApplicationStatus.DRAFT,
                    FellowshipApplicationStatus.SUBMITTED,
                ]),
            },
        });

        if (existingActive) {
            throw new BadRequestException(
                `You already have a pending or draft ${dto.type} fellowship application`,
            );
        }

        const application = this.applicationRepository.create({
            type: dto.type,
            proposal: dto.proposal,
            status: FellowshipApplicationStatus.DRAFT,
            applicant: user,
        });

        const saved = await this.applicationRepository.save(application);

        const result = await this.applicationRepository.findOneOrFail({
            where: { id: saved.id },
            relations: {
                applicant: true,
                reviewedBy: true,
            },
        });

        return FellowshipApplicationResponseDto.fromEntity(result);
    }

    async updateApplication(
        id: string,
        user: User,
        dto: UpdateFellowshipApplicationRequestDto,
    ): Promise<FellowshipApplicationResponseDto> {
        const application = await this.applicationRepository.findOne({
            where: { id },
            relations: {
                applicant: true,
                reviewedBy: true,
            },
        });

        if (!application) {
            throw new NotFoundException('Application not found');
        }

        if (application.applicant.id !== user.id) {
            throw new ForbiddenException();
        }

        const editableStatuses: FellowshipApplicationStatus[] = [
            FellowshipApplicationStatus.DRAFT,
            FellowshipApplicationStatus.CHANGES_REQUESTED,
        ];

        if (!editableStatuses.includes(application.status)) {
            throw new BadRequestException(
                'Only draft or changes-requested applications can be updated',
            );
        }

        if (dto.proposal !== undefined) {
            application.proposal = dto.proposal;
        }

        await this.applicationRepository.save(application);

        return FellowshipApplicationResponseDto.fromEntity(application);
    }

    async submitApplication(
        id: string,
        user: User,
    ): Promise<FellowshipApplicationResponseDto> {
        const application = await this.applicationRepository.findOne({
            where: { id },
            relations: {
                applicant: true,
                reviewedBy: true,
            },
        });

        if (!application) {
            throw new NotFoundException('Application not found');
        }

        if (application.applicant.id !== user.id) {
            throw new ForbiddenException();
        }

        const submittableStatuses: FellowshipApplicationStatus[] = [
            FellowshipApplicationStatus.DRAFT,
            FellowshipApplicationStatus.CHANGES_REQUESTED,
        ];

        if (!submittableStatuses.includes(application.status)) {
            throw new BadRequestException(
                'Only draft or changes-requested applications can be submitted',
            );
        }

        application.status = FellowshipApplicationStatus.SUBMITTED;
        application.reviewedBy = null;
        application.reviewerRemarks = null;
        await this.applicationRepository.save(application);

        if (user.email) {
            try {
                await this.mailService.sendFellowshipApplicationReceivedEmail(
                    user.email,
                    user.displayName,
                    application.type,
                );
            } catch (err) {
                this.logger.error(
                    `Failed to send application received email to ${user.email}`,
                    (err as Error).stack,
                );
            }
        }

        return FellowshipApplicationResponseDto.fromEntity(application);
    }

    async deleteDraft(id: string, user: User): Promise<void> {
        const application = await this.applicationRepository.findOne({
            where: { id },
            relations: { applicant: true },
        });

        if (!application) {
            throw new NotFoundException('Application not found');
        }

        if (application.applicant.id !== user.id) {
            throw new ForbiddenException();
        }

        if (application.status !== FellowshipApplicationStatus.DRAFT) {
            throw new BadRequestException(
                'Only draft applications can be deleted',
            );
        }

        await this.applicationRepository.remove(application);
    }

    async getMyApplications(
        user: User,
        query: PaginatedQueryDto,
    ): Promise<PaginatedDataDto<FellowshipApplicationResponseDto>> {
        const [records, totalRecords] =
            await this.applicationRepository.findAndCount({
                where: { applicant: { id: user.id } },
                relations: {
                    applicant: true,
                    reviewedBy: true,
                },
                order: { createdAt: 'DESC' },
                skip: query.page * query.pageSize,
                take: query.pageSize,
            });

        return new PaginatedDataDto({
            totalRecords,
            records: records.map(FellowshipApplicationResponseDto.fromEntity),
        });
    }

    async getApplicationProposal(
        id: string,
        user: User,
    ): Promise<FellowshipApplicationProposalResponseDto> {
        const application = await this.applicationRepository.findOne({
            where: { id },
            relations: { applicant: true },
        });

        if (!application) {
            throw new NotFoundException('Application not found');
        }

        if (
            application.applicant.id !== user.id &&
            user.role !== UserRole.ADMIN
        ) {
            throw new ForbiddenException();
        }

        return new FellowshipApplicationProposalResponseDto(
            application.proposal,
        );
    }

    async getApplicationById(
        id: string,
        user: User,
    ): Promise<FellowshipApplicationResponseDto> {
        const application = await this.applicationRepository.findOne({
            where: { id },
            relations: {
                applicant: true,
                reviewedBy: true,
            },
        });

        if (!application) {
            throw new NotFoundException('Application not found');
        }

        if (
            application.applicant.id !== user.id &&
            user.role !== UserRole.ADMIN
        ) {
            throw new ForbiddenException();
        }

        return FellowshipApplicationResponseDto.fromEntity(application);
    }

    async listApplications(
        query: ListFellowshipApplicationsQueryDto,
    ): Promise<PaginatedDataDto<FellowshipApplicationResponseDto>> {
        const qb = this.applicationRepository
            .createQueryBuilder('application')
            .leftJoinAndSelect('application.applicant', 'applicant')
            .leftJoinAndSelect('application.reviewedBy', 'reviewedBy');

        if (query.status) {
            qb.andWhere('application.status = :status', {
                status: query.status,
            });
        } else {
            qb.andWhere('application.status != :draftStatus', {
                draftStatus: FellowshipApplicationStatus.DRAFT,
            });
        }

        if (query.type) {
            qb.andWhere('application.type = :type', { type: query.type });
        }

        if (query.search) {
            qb.andWhere(
                new Brackets((w) =>
                    w
                        .where('applicant.name ILIKE :search')
                        .orWhere('applicant.discordUserName ILIKE :search')
                        .orWhere('applicant.discordGlobalName ILIKE :search')
                        .orWhere('applicant.email ILIKE :search'),
                ),
                { search: `%${escapeLikePattern(query.search)}%` },
            );
        }

        const order = query.sortOrder === SortOrder.ASC ? 'ASC' : 'DESC';

        const [records, totalRecords] = await qb
            .orderBy(APPLICATION_SORT_COLUMNS[query.sortBy], order)
            .addOrderBy('application.id', 'ASC')
            .skip(query.page * query.pageSize)
            .take(query.pageSize)
            .getManyAndCount();

        return new PaginatedDataDto({
            totalRecords,
            records: records.map(FellowshipApplicationResponseDto.fromEntity),
        });
    }

    async reviewApplication(
        id: string,
        reviewer: User,
        dto: ReviewFellowshipApplicationRequestDto,
    ): Promise<FellowshipApplicationResponseDto> {
        const application = await this.applicationRepository.findOne({
            where: { id },
            relations: {
                applicant: true,
                reviewedBy: true,
            },
        });

        if (!application) {
            throw new NotFoundException('Application not found');
        }

        if (application.status !== FellowshipApplicationStatus.SUBMITTED) {
            throw new BadRequestException(
                application.status === FellowshipApplicationStatus.DRAFT
                    ? 'Cannot review a draft application'
                    : `Application has already been ${application.status.toLowerCase()}`,
            );
        }

        const validReviewStatuses: FellowshipApplicationStatus[] = [
            FellowshipApplicationStatus.ACCEPTED,
            FellowshipApplicationStatus.REJECTED,
            FellowshipApplicationStatus.CHANGES_REQUESTED,
        ];

        if (!validReviewStatuses.includes(dto.status)) {
            throw new BadRequestException(
                'Review status must be ACCEPTED, REJECTED, or CHANGES_REQUESTED',
            );
        }

        if (
            dto.status === FellowshipApplicationStatus.REJECTED &&
            !dto.reviewerRemarks
        ) {
            throw new BadRequestException(
                'Reviewer remarks are required when rejecting an application',
            );
        }

        if (
            dto.status === FellowshipApplicationStatus.CHANGES_REQUESTED &&
            !dto.reviewerRemarks
        ) {
            throw new BadRequestException(
                'Reviewer remarks are required when requesting changes',
            );
        }

        if (
            dto.status === FellowshipApplicationStatus.ACCEPTED &&
            !dto.driveFolderUrl
        ) {
            throw new BadRequestException(
                'A Google Drive folder URL is required when accepting an application',
            );
        }

        application.status = dto.status;
        application.reviewedBy = reviewer;
        if (dto.reviewerRemarks) {
            application.reviewerRemarks = dto.reviewerRemarks;
        }

        await this.applicationRepository.save(application);

        if (dto.status === FellowshipApplicationStatus.ACCEPTED) {
            const fellowship = this.fellowshipRepository.create({
                type: application.type,
                user: application.applicant,
                application: application,
                driveFolderUrl: dto.driveFolderUrl,
            });
            await this.fellowshipRepository.save(fellowship);
        }

        const applicant = application.applicant;
        if (applicant.email) {
            try {
                if (dto.status === FellowshipApplicationStatus.ACCEPTED) {
                    await this.mailService.sendFellowshipApplicationAcceptedEmail(
                        applicant.email,
                        applicant.displayName,
                        application.type,
                        dto.driveFolderUrl!,
                    );
                } else if (
                    dto.status === FellowshipApplicationStatus.REJECTED
                ) {
                    await this.mailService.sendFellowshipApplicationRejectedEmail(
                        applicant.email,
                        applicant.displayName,
                        application.type,
                        dto.reviewerRemarks ??
                            'No additional feedback provided by the reviewer.',
                    );
                } else if (
                    dto.status === FellowshipApplicationStatus.CHANGES_REQUESTED
                ) {
                    await this.mailService.sendFellowshipApplicationChangesRequestedEmail(
                        applicant.email,
                        applicant.displayName,
                        application.type,
                        dto.reviewerRemarks ??
                            'No additional feedback provided by the reviewer.',
                    );
                }
            } catch (err) {
                this.logger.error(
                    `Failed to send review email to ${applicant.email}`,
                    (err as Error).stack,
                );
            }
        }

        return FellowshipApplicationResponseDto.fromEntity(application);
    }
}
