import { Injectable } from '@nestjs/common';
import { join } from 'path';
import { accessSync, constants, readFileSync } from 'fs';
import { ServiceError } from '@/common/errors';
import { CertificateType, CohortType } from '@/common/enum';
import { CertificateFonts } from '@/certificates/certificates.enums';
import { TOP_PERFORMER_CUTOFF } from '@/certificates/certificates.constants';

@Injectable()
export class CertificatesCacheService {
    // Font data buffers
    private readonly nautigalFontBytes: Buffer;
    private readonly robotoFontBytes: Buffer;

    // Certificate template cache
    private readonly certificateTemplates: Map<string, Buffer>;

    constructor() {
        this.certificateTemplates = new Map();

        // Load certificate templates
        for (const cohortType of Object.values(CohortType)) {
            for (const withExercises of [false, true]) {
                // Load participant templates
                const participantPath = this.templateNameToPath(
                    cohortType,
                    CertificateType.PARTICIPANT,
                    withExercises,
                    null,
                );
                this.assertFileExists(participantPath);
                this.certificateTemplates.set(
                    this.templateKey(
                        cohortType,
                        CertificateType.PARTICIPANT,
                        withExercises,
                        null,
                    ),
                    readFileSync(participantPath),
                );

                // Load performer templates for each rank
                for (let rank = 1; rank <= TOP_PERFORMER_CUTOFF; rank++) {
                    const performerPath = this.templateNameToPath(
                        cohortType,
                        CertificateType.PERFORMER,
                        withExercises,
                        rank,
                    );
                    this.assertFileExists(performerPath);
                    this.certificateTemplates.set(
                        this.templateKey(
                            cohortType,
                            CertificateType.PERFORMER,
                            withExercises,
                            rank,
                        ),
                        readFileSync(performerPath),
                    );
                }
            }
        }

        // Load font files
        for (const font of Object.values(CertificateFonts)) {
            const fontPath = this.fontNameToPaths(font);
            this.assertFileExists(fontPath);

            const fontBuffer = readFileSync(fontPath);
            if (font === CertificateFonts.NAUTIGAL) {
                this.nautigalFontBytes = fontBuffer;
            } else if (font === CertificateFonts.ROBOTO) {
                this.robotoFontBytes = fontBuffer;
            } else {
                throw new ServiceError(`Unknown font: ${font}`);
            }
        }
    }

    private getTemplateBaseDirectory(): string {
        return join(__dirname, '..', 'assets', 'certificates');
    }

    private getFontBaseDirectory(): string {
        return join(__dirname, '..', 'assets', 'fonts');
    }

    private assertFileExists(filePath: string): void {
        try {
            accessSync(filePath, constants.R_OK);
        } catch (err) {
            throw new ServiceError(`Missing template: ${filePath}`);
        }
    }

    private templateKey(
        cohortType: CohortType,
        certificateType: CertificateType,
        withExercises: boolean,
        rank: number | null,
    ): string {
        const key = `${certificateType}:${cohortType}:${withExercises}`;

        if (rank !== null) {
            return `${key}:${rank}`;
        }

        return key;
    }

    private templateNameToPath(
        cohortType: CohortType,
        certificateType: CertificateType,
        withExercises: boolean,
        rank: number | null,
    ): string {
        const baseDir = this.getTemplateBaseDirectory();
        let fileName = cohortType as string;

        if (withExercises) {
            fileName += '_WITH_EXERCISES';
        }

        if (rank !== null) {
            fileName += `_RANK_${rank}`;
        }

        return join(baseDir, certificateType.toLowerCase(), `${fileName}.pdf`);
    }

    private fontNameToPaths(fontName: CertificateFonts): string {
        const baseDir = this.getFontBaseDirectory();

        return join(baseDir, `${fontName.toLowerCase()}.ttf`);
    }

    getCertificateTemplate(
        cohortType: CohortType,
        certificateType: CertificateType,
        withExercises: boolean,
        rank: number | null,
    ): Buffer {
        if (certificateType === CertificateType.PERFORMER && rank === null) {
            throw new ServiceError(
                `Rank must be provided for performer certificates`,
            );
        }

        const key = this.templateKey(
            cohortType,
            certificateType,
            withExercises,
            rank,
        );
        const template = this.certificateTemplates.get(key);

        if (!template) {
            throw new ServiceError(
                `Certificate template not found for: ${key}`,
            );
        }

        return template;
    }

    getFontBytes(fontName: CertificateFonts): Buffer {
        if (fontName === CertificateFonts.NAUTIGAL) {
            return this.nautigalFontBytes;
        } else if (fontName === CertificateFonts.ROBOTO) {
            return this.robotoFontBytes;
        } else {
            throw new ServiceError(`Unknown font: ${fontName}`);
        }
    }
}
