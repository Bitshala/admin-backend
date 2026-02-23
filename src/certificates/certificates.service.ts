import {
    BadRequestException,
    Injectable,
    Logger,
    StreamableFile,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cohort } from '@/entities/cohort.entity';
import { ServiceError } from '@/common/errors';
import { CertificatesGenerationService } from '@/certificates/certificates-generation.service';
import { CertificateType } from '@/common/enum';
import { ScoresService } from '@/scores/scores.service';
import {
    ABSENCE_THRESHOLD_DAYS,
    TOP_PERFORMER_CUTOFF,
} from '@/certificates/certificates.constants';
import { Certificate } from '@/entities/certificate.entity';
import { User } from '@/entities/user.entity';
import { GetCertificateResponseDto } from '@/certificates/certificates.response.dto';
import { generateCertificateFileName } from '@/certificates/certificates.utils';

@Injectable()
export class CertificatesService {
    private readonly logger = new Logger(CertificatesService.name);

    constructor(
        @InjectRepository(Certificate)
        private readonly certificateRepository: Repository<Certificate>,
        @InjectRepository(Cohort)
        private readonly cohortRepository: Repository<Cohort>,
        private readonly scoresService: ScoresService,
        private readonly certificatesGenerationService: CertificatesGenerationService,
    ) {}

    async generateCertificatesForCohort(cohortId: string): Promise<void> {
        const cohort = await this.cohortRepository.findOne({
            where: { id: cohortId },
        });

        if (!cohort) {
            throw new ServiceError(`Cohort with id ${cohortId} not found`);
        }

        if (cohort.endDate > new Date()) {
            throw new BadRequestException(
                `Cohort with id ${cohortId} has not ended yet. Certificates can only be generated after the cohort ends.`,
            );
        }

        const leaderboard = await this.scoresService.getCohortLeaderboard(
            cohortId,
        );

        const absenceThresholdDays = ABSENCE_THRESHOLD_DAYS[cohort.type];

        const certificateEntities = leaderboard
            .filter(
                (entry) =>
                    entry.totalAttendance >=
                    entry.maxAttendance - absenceThresholdDays,
            )
            .map((entry, index) => {
                const certificateType: CertificateType =
                    index < TOP_PERFORMER_CUTOFF
                        ? CertificateType.PERFORMER
                        : CertificateType.PARTICIPANT;

                const certificateEntity = new Certificate();
                certificateEntity.type = certificateType;
                certificateEntity.name =
                    entry.name ||
                    entry.discordGlobalName ||
                    entry.discordUsername;
                certificateEntity.cohort = cohort;
                certificateEntity.user = {
                    id: entry.userId,
                } as User;

                if (certificateType === CertificateType.PERFORMER) {
                    certificateEntity.rank = index + 1;
                } else {
                    certificateEntity.rank = null;
                }

                certificateEntity.withExercises =
                    entry.exerciseMaxTotalScore > 0 &&
                    entry.exerciseTotalScore === entry.exerciseMaxTotalScore;

                return certificateEntity;
            });

        // We first delete existing certificates for the cohort to avoid duplicates
        // This is to ensure that if the generation process is re-run, we don't end up with multiple
        await this.certificateRepository.delete({ cohort: { id: cohortId } });
        await this.certificateRepository.save(certificateEntities);
        this.logger.log(
            `Saved ${certificateEntities.length} certificate records for cohort ${cohortId}`,
        );
    }

    async getUserCertificateForCohort(
        userId: string,
        cohortId: string,
    ): Promise<GetCertificateResponseDto> {
        const certificate = await this.certificateRepository.findOne({
            where: {
                user: { id: userId },
                cohort: { id: cohortId },
            },
            relations: {
                cohort: true,
                user: true,
            },
        });

        if (!certificate) {
            throw new BadRequestException(
                `Certificate not found for user ${userId} in cohort ${cohortId}`,
            );
        }

        return GetCertificateResponseDto.fromEntity(certificate);
    }

    async getUserCertificates(
        userId: string,
    ): Promise<GetCertificateResponseDto[]> {
        const certificates = await this.certificateRepository.find({
            where: {
                user: { id: userId },
            },
            relations: {
                cohort: true,
                user: true,
            },
        });

        return GetCertificateResponseDto.fromEntities(certificates);
    }

    async getCohortCertificates(
        cohortId: string,
    ): Promise<GetCertificateResponseDto[]> {
        const certificates = await this.certificateRepository.find({
            where: {
                cohort: { id: cohortId },
            },
            relations: {
                cohort: true,
                user: true,
            },
        });

        return GetCertificateResponseDto.fromEntities(certificates);
    }

    async downloadCertificate(id: string): Promise<{
        fileName: string;
        fileBuffer: StreamableFile;
    }> {
        const certificate = await this.certificateRepository.findOne({
            where: { id },
            relations: {
                cohort: true,
                user: true,
            },
        });

        if (!certificate) {
            throw new BadRequestException(
                `Certificate with id ${id} not found`,
            );
        }

        const fileBuffer =
            await this.certificatesGenerationService.generateCertificateFromEntity(
                certificate,
            );

        return {
            fileName: generateCertificateFileName(
                certificate.user.id,
                certificate.cohort.type,
            ),
            fileBuffer: new StreamableFile(fileBuffer),
        };
    }
}
