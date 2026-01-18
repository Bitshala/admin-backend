import { Injectable, Logger } from '@nestjs/common';
import { PDFDocument, PDFFont } from 'pdf-lib';
import * as fontkit from '@pdf-lib/fontkit';
import { CertificateType, CohortType } from '@/common/enum';
import { CertificateFonts } from '@/certificates/certificates.enums';
import {
    CERTIFICATE_DATE_POSITION,
    CERTIFICATE_FONT_CONSTRAINTS,
    CERTIFICATE_NAME_POSITION,
    CERTIFICATE_TEXT_COLOR,
} from '@/certificates/certificates.constants';
import { CertificatesCacheService } from '@/certificates/certificates.cache.service';
import { formatCertificateDate } from '@/certificates/certificates.utils';
import { Certificate } from '@/entities/certificate.entity';

@Injectable()
export class CertificatesGenerationService {
    private readonly logger = new Logger(CertificatesGenerationService.name);

    constructor(
        private readonly certificatesCacheService: CertificatesCacheService,
    ) {}

    private calculateFontSize(
        text: string,
        maxWidth: number,
        font: any,
    ): number {
        let fontSize = CERTIFICATE_FONT_CONSTRAINTS.NAME_MAX;
        let textWidth = font.widthOfTextAtSize(text, fontSize);

        // Decrease font size until the text fits within maxWidth
        while (
            textWidth > maxWidth &&
            fontSize > CERTIFICATE_FONT_CONSTRAINTS.NAME_MIN
        ) {
            fontSize -= CERTIFICATE_FONT_CONSTRAINTS.NAME_STEP;
            textWidth = font.widthOfTextAtSize(text, fontSize);
        }

        return fontSize;
    }

    private async initializePDFDocument(
        cohortType: CohortType,
        certificateType: CertificateType,
    ): Promise<{
        pdfDocument: PDFDocument;
        nautigalFont: PDFFont;
        robotoFont: PDFFont;
    }> {
        const template = this.certificatesCacheService.getCertificateTemplate(
            cohortType,
            certificateType,
        );

        // Load a PDFDocument from the template
        const pdfDocument = await PDFDocument.load(template);
        pdfDocument.registerFontkit(fontkit);

        // Embed the custom fonts
        const nautigalFont = await pdfDocument.embedFont(
            this.certificatesCacheService.getFontBytes(
                CertificateFonts.NAUTIGAL,
            ),
        );
        const robotoFont = await pdfDocument.embedFont(
            this.certificatesCacheService.getFontBytes(CertificateFonts.ROBOTO),
        );

        return { pdfDocument, nautigalFont, robotoFont };
    }

    async generateCertificate(
        name: string,
        cohortType: CohortType,
        certificateType: CertificateType,
        date: Date,
    ): Promise<Buffer> {
        try {
            const { pdfDocument, nautigalFont, robotoFont } =
                await this.initializePDFDocument(cohortType, certificateType);

            // Get the first page of the document
            const pages = pdfDocument.getPages();
            const page = pages[0];

            // Create a string of name and measure its width and height in our custom font
            const nameFontSize = this.calculateFontSize(
                name,
                CERTIFICATE_NAME_POSITION.maxWidth,
                nautigalFont,
            );
            const nameWidth = nautigalFont.widthOfTextAtSize(
                name,
                nameFontSize,
            );

            // Write name on the page
            page.drawText(name, {
                x: CERTIFICATE_NAME_POSITION.x - nameWidth / 2,
                y: CERTIFICATE_NAME_POSITION.y,
                size: nameFontSize,
                font: nautigalFont,
                color: CERTIFICATE_TEXT_COLOR,
            });

            const dateString = formatCertificateDate(date);
            const dateWidth = robotoFont.widthOfTextAtSize(
                dateString,
                CERTIFICATE_DATE_POSITION.size,
            );

            // Write date on the page
            page.drawText(dateString, {
                x: CERTIFICATE_DATE_POSITION.x - dateWidth / 2,
                y: CERTIFICATE_DATE_POSITION.y,
                size: CERTIFICATE_DATE_POSITION.size,
                font: robotoFont,
                color: CERTIFICATE_TEXT_COLOR,
            });

            const pdfBytes = await pdfDocument.save();

            return Buffer.from(pdfBytes);
        } catch (error) {
            this.logger.error(
                `Failed to generate certificate for ${name}:`,
                error,
            );
            throw error;
        }
    }

    async generateCertificateFromEntity(
        certificate: Certificate,
    ): Promise<Buffer> {
        return this.generateCertificate(
            certificate.name,
            certificate.cohort.type,
            certificate.type,
            certificate.cohort.endDate,
        );
    }
}
