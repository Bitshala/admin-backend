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
    FellowshipType,
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
import {
    GITHUB_USERNAME_RE,
    LINK_LIMIT,
    MAX_LINKS,
    normalizeLinkForDedup,
    URL_RE,
} from '@/fellowship-applications/proposal-validation';

// Persist empty/blank proposal fields as NULL rather than empty strings so the
// stored shape is consistent regardless of which endpoint wrote it.
const emptyToNull = (value: string | undefined): string | null => {
    const trimmed = value?.trim();
    return trimmed ? trimmed : null;
};

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
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        private readonly mailService: MailService,
        private readonly githubClient: GitHubClassroomClient,
    ) {}

    /**
     * Onboarding fields that already live on the user profile (e.g. location,
     * GitHub) are written through to the applicant's profile rather than
     * duplicated on the application. `github` is stored as a bare handle on the
     * application but the profile holds a full URL, so it is expanded here.
     * Only persists when at least one profile field was sent.
     */
    private async applyProfileFields(
        user: User,
        dto:
            | CreateFellowshipApplicationRequestDto
            | UpdateFellowshipApplicationRequestDto,
    ): Promise<void> {
        let changed = false;
        if (dto.location !== undefined) {
            user.location = emptyToNull(dto.location);
            changed = true;
        }
        if (dto.github !== undefined) {
            const handle = emptyToNull(dto.github);
            user.githubProfileUrl = handle
                ? `https://github.com/${handle}`
                : null;
            changed = true;
        }
        if (changed) {
            await this.userRepository.save(user);
        }
    }

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

        await this.applyProfileFields(user, dto);

        const application = this.applicationRepository.create({
            type: dto.type,
            status: FellowshipApplicationStatus.DRAFT,
            applicant: user,
            title: emptyToNull(dto.title),
            problemStatement: emptyToNull(dto.problemStatement),
            plan: emptyToNull(dto.plan),
            mentorName: emptyToNull(dto.mentorName),
            mentorContact: emptyToNull(dto.mentorContact),
            mentorTestimonial: emptyToNull(dto.mentorTestimonial),
            github: emptyToNull(dto.github),
            links: dto.links ?? [],
            projectName: emptyToNull(dto.projectName),
            projectGithubLink: emptyToNull(dto.projectGithubLink),
            academicBackground: emptyToNull(dto.academicBackground),
            graduationYear: dto.graduationYear ?? null,
            professionalExperience: emptyToNull(dto.professionalExperience),
            domains: dto.domains ?? null,
            codingLanguages: dto.codingLanguages ?? null,
            educationInterests: dto.educationInterests ?? null,
            bitcoinContributions: emptyToNull(dto.bitcoinContributions),
            bitcoinMotivation: emptyToNull(dto.bitcoinMotivation),
            bitcoinOssGoal: emptyToNull(dto.bitcoinOssGoal),
            additionalInfo: emptyToNull(dto.additionalInfo),
            questionsForBitshala: emptyToNull(dto.questionsForBitshala),
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

        // Only overwrite fields the client actually sent, so a partial draft
        // save doesn't wipe untouched fields. Empty strings clear the field.
        const textFields = [
            'title',
            'problemStatement',
            'plan',
            'mentorName',
            'mentorContact',
            'mentorTestimonial',
            'github',
            'projectName',
            'projectGithubLink',
            'academicBackground',
            'professionalExperience',
            'bitcoinContributions',
            'bitcoinMotivation',
            'bitcoinOssGoal',
            'additionalInfo',
            'questionsForBitshala',
        ] as const;
        for (const field of textFields) {
            if (dto[field] !== undefined) {
                application[field] = emptyToNull(dto[field]);
            }
        }
        if (dto.links !== undefined) {
            application.links = dto.links;
        }
        if (dto.graduationYear !== undefined) {
            application.graduationYear = dto.graduationYear ?? null;
        }
        const arrayFields = [
            'domains',
            'codingLanguages',
            'educationInterests',
        ] as const;
        for (const field of arrayFields) {
            if (dto[field] !== undefined) {
                application[field] = dto[field] ?? null;
            }
        }

        await this.applyProfileFields(application.applicant, dto);

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

        this.validateProposalForSubmit(application);

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

    /**
     * Full proposal ruleset enforced only on submit. Draft create/update accept
     * partial values, so the strict required/min-length/conditional checks live
     * here rather than on the request DTOs.
     */
    private validateProposalForSubmit(
        application: FellowshipApplication,
    ): void {
        const errors: string[] = [];
        const isDeveloper = application.type === FellowshipType.DEVELOPER;

        const requiredText: [string, string | null][] = [
            ['Title', application.title],
            ['Problem statement', application.problemStatement],
            ['Plan', application.plan],
            ['Mentor name', application.mentorName],
            ['Mentor contact', application.mentorContact],
            ['Academic background', application.academicBackground],
            ['Professional experience', application.professionalExperience],
            ['Bitcoin contributions', application.bitcoinContributions],
            ['Bitcoin motivation', application.bitcoinMotivation],
            ['Bitcoin OSS goal', application.bitcoinOssGoal],
        ];
        // Project details are only required on the developer track.
        if (isDeveloper) {
            requiredText.push(
                ['Project name', application.projectName],
                ['Project GitHub link', application.projectGithubLink],
            );
        }
        for (const [label, value] of requiredText) {
            if (!value || !value.trim()) {
                errors.push(`${label} is required`);
            }
        }

        if (application.graduationYear == null) {
            errors.push('Graduation year is required');
        }

        const requiredArrays: [string, string[] | null][] = [
            ['Domains', application.domains],
            ['Education interests', application.educationInterests],
        ];
        // Coding languages are only required on the developer track.
        if (isDeveloper) {
            requiredArrays.push([
                'Coding languages',
                application.codingLanguages,
            ]);
        }
        for (const [label, value] of requiredArrays) {
            if (!value || value.length === 0) {
                errors.push(`${label} is required`);
            }
        }

        // github is required for developers; for other tracks it's optional but
        // must still be a valid username when present.
        if (
            isDeveloper &&
            (!application.github || !application.github.trim())
        ) {
            errors.push(
                'A GitHub username is required for developer applications',
            );
        }
        if (
            application.github &&
            !GITHUB_USERNAME_RE.test(application.github)
        ) {
            errors.push('GitHub username is invalid');
        }

        const links = application.links ?? [];
        if (links.length > MAX_LINKS) {
            errors.push(`At most ${MAX_LINKS} links are allowed`);
        }
        const seen = new Set<string>();
        for (const link of links) {
            if (link.length > LINK_LIMIT || !URL_RE.test(link)) {
                errors.push(`Invalid link: ${link}`);
                continue;
            }
            const key = normalizeLinkForDedup(link);
            if (seen.has(key)) {
                errors.push(`Duplicate link: ${link}`);
            }
            seen.add(key);
        }

        if (errors.length > 0) {
            throw new BadRequestException(errors.join('; '));
        }
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

        return FellowshipApplicationProposalResponseDto.fromEntity(application);
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
