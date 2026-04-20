import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    Logger,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Not, Repository } from 'typeorm';
import { FellowshipApplication } from '@/entities/fellowship-application.entity';
import { Fellowship } from '@/entities/fellowship.entity';
import { User } from '@/entities/user.entity';
import {
    FellowshipApplicationStatus,
    FellowshipType,
    UserRole,
} from '@/common/enum';
import {
    CreateFellowshipApplicationRequestDto,
    ReviewFellowshipApplicationRequestDto,
    UpdateFellowshipApplicationRequestDto,
} from '@/fellowship-applications/fellowship-applications.request.dto';
import {
    FellowshipApplicationProposalResponseDto,
    FellowshipApplicationResponseDto,
} from '@/fellowship-applications/fellowship-applications.response.dto';
import { PaginatedDataDto, PaginatedQueryDto } from '@/common/dto';
import { MailService } from '@/mail/mail.service';

@Injectable()
export class FellowshipApplicationsService {
    private readonly logger = new Logger(FellowshipApplicationsService.name);

    constructor(
        @InjectRepository(FellowshipApplication)
        private readonly applicationRepository: Repository<FellowshipApplication>,
        @InjectRepository(Fellowship)
        private readonly fellowshipRepository: Repository<Fellowship>,
        private readonly mailService: MailService,
    ) {}

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

    async updateDraft(
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

        if (application.status !== FellowshipApplicationStatus.DRAFT) {
            throw new BadRequestException(
                'Only draft applications can be updated',
            );
        }

        if (dto.proposal !== undefined) {
            application.proposal = dto.proposal;
        }

        await this.applicationRepository.save(application);

        return FellowshipApplicationResponseDto.fromEntity(application);
    }

    async submitDraft(
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

        if (application.status !== FellowshipApplicationStatus.DRAFT) {
            throw new BadRequestException(
                'Only draft applications can be submitted',
            );
        }

        application.status = FellowshipApplicationStatus.SUBMITTED;
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
        query: PaginatedQueryDto,
        status?: FellowshipApplicationStatus,
        type?: FellowshipType,
    ): Promise<PaginatedDataDto<FellowshipApplicationResponseDto>> {
        const [records, totalRecords] =
            await this.applicationRepository.findAndCount({
                where: {
                    ...(status
                        ? { status }
                        : { status: Not(FellowshipApplicationStatus.DRAFT) }),
                    ...(type && { type }),
                },
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

        if (
            dto.status === FellowshipApplicationStatus.REJECTED &&
            !dto.reviewerRemarks
        ) {
            throw new BadRequestException(
                'Reviewer remarks are required when rejecting an application',
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
