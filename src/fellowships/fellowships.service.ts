import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Fellowship } from '@/entities/fellowship.entity';
import { User } from '@/entities/user.entity';
import {
    CompleteFellowshipOnboardingDto,
    StartFellowshipContractDto,
} from '@/fellowships/fellowships.request.dto';
import { FellowshipStatus } from '@/common/enum';
import { FellowshipResponseDto } from '@/fellowships/fellowships.response.dto';
import { PaginatedDataDto, PaginatedQueryDto } from '@/common/dto';
import { UserRole } from '@/common/enum';

@Injectable()
export class FellowshipsService {
    constructor(
        @InjectRepository(Fellowship)
        private readonly fellowshipRepository: Repository<Fellowship>,
    ) {}

    async completeOnboarding(
        user: User,
        fellowshipId: string,
        dto: CompleteFellowshipOnboardingDto,
    ): Promise<FellowshipResponseDto> {
        const fellowship = await this.fellowshipRepository.findOne({
            where: { id: fellowshipId },
            relations: {
                user: true,
                application: true,
            },
        });

        if (!fellowship) {
            throw new NotFoundException('Fellowship not found');
        }

        if (fellowship.user.id !== user.id && user.role !== UserRole.ADMIN) {
            throw new ForbiddenException();
        }

        if (dto.mentorContact !== undefined) {
            fellowship.mentorContact = dto.mentorContact;
        }
        if (dto.projectName !== undefined) {
            fellowship.projectName = dto.projectName;
        }
        if (dto.projectGithubLink !== undefined) {
            fellowship.projectGithubLink = dto.projectGithubLink;
        }
        if (dto.githubProfile !== undefined) {
            fellowship.githubProfile = dto.githubProfile;
        }
        if (dto.location !== undefined) {
            fellowship.location = dto.location;
        }
        if (dto.academicBackground !== undefined) {
            fellowship.academicBackground = dto.academicBackground;
        }
        if (dto.graduationYear !== undefined) {
            fellowship.graduationYear = dto.graduationYear;
        }
        if (dto.professionalExperience !== undefined) {
            fellowship.professionalExperience = dto.professionalExperience;
        }
        if (dto.domains !== undefined) {
            fellowship.domains = dto.domains;
        }
        if (dto.codingLanguages !== undefined) {
            fellowship.codingLanguages = dto.codingLanguages;
        }
        if (dto.educationInterests !== undefined) {
            fellowship.educationInterests = dto.educationInterests;
        }
        if (dto.bitcoinContributions !== undefined) {
            fellowship.bitcoinContributions = dto.bitcoinContributions;
        }
        if (dto.bitcoinMotivation !== undefined) {
            fellowship.bitcoinMotivation = dto.bitcoinMotivation;
        }
        if (dto.bitcoinOssGoal !== undefined) {
            fellowship.bitcoinOssGoal = dto.bitcoinOssGoal;
        }
        if (dto.additionalInfo !== undefined) {
            fellowship.additionalInfo = dto.additionalInfo ?? null;
        }
        if (dto.questionsForBitshala !== undefined) {
            fellowship.questionsForBitshala = dto.questionsForBitshala ?? null;
        }

        await this.fellowshipRepository.save(fellowship);

        return FellowshipResponseDto.fromEntity(fellowship);
    }

    async startContract(
        fellowshipId: string,
        dto: StartFellowshipContractDto,
    ): Promise<FellowshipResponseDto> {
        const fellowship = await this.fellowshipRepository.findOne({
            where: { id: fellowshipId },
            relations: {
                user: true,
                application: true,
            },
        });

        if (!fellowship) {
            throw new NotFoundException('Fellowship not found');
        }

        if (fellowship.status !== FellowshipStatus.PENDING) {
            throw new BadRequestException(
                `Fellowship contract has already been started`,
            );
        }

        fellowship.startDate = new Date(dto.startDate);
        fellowship.endDate = new Date(dto.endDate);
        fellowship.amountUsd = dto.amountUsd.toString();
        fellowship.status = FellowshipStatus.ACTIVE;

        await this.fellowshipRepository.save(fellowship);

        return FellowshipResponseDto.fromEntity(fellowship);
    }

    async getMyFellowships(
        user: User,
        query: PaginatedQueryDto,
    ): Promise<PaginatedDataDto<FellowshipResponseDto>> {
        const [records, totalRecords] =
            await this.fellowshipRepository.findAndCount({
                where: { user: { id: user.id } },
                relations: {
                    user: true,
                    application: true,
                },
                order: { createdAt: 'DESC' },
                skip: query.page * query.pageSize,
                take: query.pageSize,
            });

        return new PaginatedDataDto({
            totalRecords,
            records: records.map(FellowshipResponseDto.fromEntity),
        });
    }

    async getFellowshipById(
        id: string,
        user: User,
    ): Promise<FellowshipResponseDto> {
        const fellowship = await this.fellowshipRepository.findOne({
            where: { id },
            relations: {
                user: true,
                application: true,
            },
        });

        if (!fellowship) {
            throw new NotFoundException('Fellowship not found');
        }

        if (fellowship.user.id !== user.id && user.role !== UserRole.ADMIN) {
            throw new ForbiddenException();
        }

        return FellowshipResponseDto.fromEntity(fellowship);
    }

    async listFellowships(
        query: PaginatedQueryDto,
    ): Promise<PaginatedDataDto<FellowshipResponseDto>> {
        const [records, totalRecords] =
            await this.fellowshipRepository.findAndCount({
                relations: {
                    user: true,
                    application: true,
                },
                order: { createdAt: 'DESC' },
                skip: query.page * query.pageSize,
                take: query.pageSize,
            });

        return new PaginatedDataDto({
            totalRecords,
            records: records.map(FellowshipResponseDto.fromEntity),
        });
    }
}
