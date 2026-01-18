import { Injectable } from '@nestjs/common';
import { join } from 'path';
import { accessSync, constants, readFileSync } from 'fs';
import { ServiceError } from '@/common/errors';
import { CertificateType, CohortType } from '@/common/enum';
import { CertificateFonts } from '@/certificates/certificates.enums';

@Injectable()
export class CertificatesCacheService {
    // Font data buffers
    private readonly nautigalFontBytes: Buffer;
    private readonly robotoFontBytes: Buffer;

    // Certificate template cache
    private readonly participantCertificateTemplates: Map<string, Buffer>;
    private readonly performerCertificateTemplates: Map<string, Buffer>;

    constructor() {
        this.participantCertificateTemplates = new Map();
        this.performerCertificateTemplates = new Map();

        // Load certificate templates
        for (const certificateType of Object.values(CertificateType)) {
            for (const cohortType of Object.values(CohortType)) {
                const templatePath = this.templateNameToPaths(
                    cohortType,
                    certificateType,
                );
                this.assertFileExists(templatePath);

                const templateBuffer = readFileSync(templatePath);
                if (certificateType === CertificateType.PARTICIPANT) {
                    this.participantCertificateTemplates.set(
                        cohortType,
                        templateBuffer,
                    );
                } else if (certificateType === CertificateType.PERFORMER) {
                    this.performerCertificateTemplates.set(
                        cohortType,
                        templateBuffer,
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

    private templateNameToPaths(
        cohortType: CohortType,
        certificateType: CertificateType,
    ): string {
        const baseDir = this.getTemplateBaseDirectory();

        return join(
            baseDir,
            certificateType.toLowerCase(),
            `${cohortType}.pdf`,
        );
    }

    private fontNameToPaths(fontName: CertificateFonts): string {
        const baseDir = this.getFontBaseDirectory();

        return join(baseDir, `${fontName.toLowerCase()}.ttf`);
    }

    getCertificateTemplate(
        cohortType: CohortType,
        certificateType: CertificateType,
    ): Buffer {
        if (certificateType === CertificateType.PARTICIPANT) {
            const template =
                this.participantCertificateTemplates.get(cohortType);
            if (!template) {
                throw new ServiceError(
                    `Participant certificate template not found for cohort type: ${cohortType}`,
                );
            }
            return template;
        } else if (certificateType === CertificateType.PERFORMER) {
            const template = this.performerCertificateTemplates.get(cohortType);
            if (!template) {
                throw new ServiceError(
                    `Performer certificate template not found for cohort type: ${cohortType}`,
                );
            }
            return template;
        } else {
            throw new ServiceError(
                `Unknown certificate type: ${certificateType}`,
            );
        }
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
