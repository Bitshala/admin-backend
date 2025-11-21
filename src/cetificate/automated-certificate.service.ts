import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cohort } from '@/entities/cohort.entity';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { ServiceError } from '@/common/errors';
import { CertificateServiceProvider } from '@/cetificate/certificate.service.provider';
import {
    CertificateType,
    CertificateRank,
} from '@/cetificate/enums/certificate.enum';
import {
    UserWithScore,
    GeneratedCertificate,
} from '@/cetificate/types/certificate.interface';
import {
    CERTIFICATE_PATHS,
    generateCertificateFileName,
    generateCertificateDownloadPath,
} from '@/cetificate/constants/certificate.constants';

@Injectable()
export class AutomatedCertificateService {
    private readonly logger = new Logger(AutomatedCertificateService.name);

    constructor(
        @InjectRepository(Cohort)
        private readonly cohortRepository: Repository<Cohort>,
        private readonly certificateServiceProvider: CertificateServiceProvider,
    ) {}

    private async getTopPerformers(cohortId: string): Promise<UserWithScore[]> {
        const cohort = await this.cohortRepository.findOne({
            where: { id: cohortId },
            relations: {
                users: {
                    groupDiscussionScores: {
                        cohort: true,
                    },
                    exerciseScores: {
                        cohort: true,
                    },
                },
            },
        });

        if (!cohort) {
            throw new ServiceError(`Cohort with id ${cohortId} not found`);
        }

        const usersWithScores: UserWithScore[] = [];

        for (const user of cohort.users) {
            let totalScore = 0;

            // Calculate total score from group discussion scores
            const userGroupScores = user.groupDiscussionScores.filter(
                (score) => score.cohort.id === cohortId,
            );
            for (const score of userGroupScores) {
                totalScore += score.totalScore;
            }

            // Calculate total score from exercise scores
            const userExerciseScores = user.exerciseScores.filter(
                (score) => score.cohort.id === cohortId,
            );
            for (const score of userExerciseScores) {
                totalScore += score.totalScore;
            }

            usersWithScores.push({
                user,
                totalScore,
            });
        }

        // Sort by total score in descending order and take top performers
        return usersWithScores
            .sort((a, b) => b.totalScore - a.totalScore)
            .slice(0, CertificateRank.TOP_TEN);
    }

    async generateCertificatesForCohort(
        cohortId: string,
    ): Promise<GeneratedCertificate[]> {
        try {
            const cohort = await this.cohortRepository.findOne({
                where: { id: cohortId },
            });

            if (!cohort) {
                throw new ServiceError(`Cohort with id ${cohortId} not found`);
            }

            const topPerformers = await this.getTopPerformers(cohortId);

            if (topPerformers.length === 0) {
                this.logger.warn(
                    `No users with scores found for cohort ${cohortId}`,
                );
                return [];
            }

            const outputDir = join(
                process.cwd(),
                CERTIFICATE_PATHS.outputPath,
                cohortId,
            );

            if (!existsSync(outputDir)) {
                mkdirSync(outputDir, { recursive: true });
            }

            const generatedCertificates: GeneratedCertificate[] = [];

            for (let i = 0; i < topPerformers.length; i++) {
                const { user } = topPerformers[i];
                const certificateType: CertificateType =
                    i < CertificateRank.TOP_THREE
                        ? CertificateType.PERFORMER
                        : CertificateType.PARTICIPANT;

                const userName = user.name || user.discordUserName;

                this.logger.log(
                    `Generating ${certificateType} certificate for ${userName}`,
                );

                const pdfBuffer =
                    await this.certificateServiceProvider.generateCertificate(
                        userName,
                        cohort.type,
                        certificateType,
                    );

                const fileName = generateCertificateFileName(
                    user.id,
                    certificateType,
                );
                const filePath = join(outputDir, fileName);

                writeFileSync(filePath, new Uint8Array(pdfBuffer));

                generatedCertificates.push({
                    userId: user.id,
                    userName,
                    certificateType,
                    filePath,
                    downloadPath: generateCertificateDownloadPath(
                        cohortId,
                        fileName,
                    ),
                });

                this.logger.log(
                    `Certificate generated successfully for ${userName} at ${filePath}`,
                );
            }

            return generatedCertificates;
        } catch (error) {
            this.logger.error(
                `Failed to generate certificates for cohort ${cohortId}:`,
                error,
            );
            throw error;
        }
    }

    async generateCertificateForUser(
        userId: string,
        cohortId: string,
    ): Promise<GeneratedCertificate> {
        try {
            const cohort = await this.cohortRepository.findOne({
                where: { id: cohortId },
            });

            if (!cohort) {
                throw new ServiceError(`Cohort with id ${cohortId} not found`);
            }

            const topPerformers = await this.getTopPerformers(cohortId);
            const userIndex = topPerformers.findIndex(
                (up) => up.user.id === userId,
            );

            if (userIndex === -1) {
                throw new ServiceError(
                    `User ${userId} is not in top 10 performers for cohort ${cohortId}`,
                );
            }

            const { user } = topPerformers[userIndex];
            const certificateType: CertificateType =
                userIndex < CertificateRank.TOP_THREE
                    ? CertificateType.PERFORMER
                    : CertificateType.PARTICIPANT;

            const userName = user.name || user.discordUserName;

            this.logger.log(
                `Generating ${certificateType} certificate for ${userName}`,
            );

            const pdfBuffer =
                await this.certificateServiceProvider.generateCertificate(
                    userName,
                    cohort.type,
                    certificateType,
                );

            const outputDir = join(
                process.cwd(),
                CERTIFICATE_PATHS.outputPath,
                cohortId,
            );

            if (!existsSync(outputDir)) {
                mkdirSync(outputDir, { recursive: true });
            }

            const fileName = generateCertificateFileName(
                user.id,
                certificateType,
            );
            const filePath = join(outputDir, fileName);

            writeFileSync(filePath, new Uint8Array(pdfBuffer));

            this.logger.log(
                `Certificate generated successfully for ${userName} at ${filePath}`,
            );

            return {
                userId: user.id,
                userName,
                certificateType,
                filePath,
                downloadPath: generateCertificateDownloadPath(
                    cohortId,
                    fileName,
                ),
            };
        } catch (error) {
            this.logger.error(
                `Failed to generate certificate for user ${userId} in cohort ${cohortId}:`,
                error,
            );
            throw error;
        }
    }
}
