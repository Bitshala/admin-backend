import { Injectable, Logger } from '@nestjs/common';
import { PDFDocument, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { readFileSync } from 'fs';
import { join } from 'path';
import { CohortType } from '@/common/enum';
import {
    CertificateType,
    CertificateFontSize,
} from '@/cetificate/enums/certificate.enum';
import {
    getCohortTypeAbbreviation,
    CERTIFICATE_NAME_POSITION,
    CERTIFICATE_DATE_POSITION,
    CERTIFICATE_TEXT_COLOR,
    CERTIFICATE_PATHS,
    CERTIFICATE_FONTS,
    CERTIFICATE_DATE_FORMAT,
} from '@/cetificate/constants/certificate.constants';

@Injectable()
export class CertificateServiceProvider {
    private readonly logger = new Logger(CertificateServiceProvider.name);
    private readonly nautigalFontBytes: Buffer;
    private readonly robotoFontBytes: Buffer;

    constructor() {
        const fontsPath = join(process.cwd(), CERTIFICATE_PATHS.fontsPath);
        this.nautigalFontBytes = readFileSync(
            join(fontsPath, CERTIFICATE_FONTS.nautigal),
        );
        this.robotoFontBytes = readFileSync(
            join(fontsPath, CERTIFICATE_FONTS.roboto),
        );
    }

    private calculateFontSize(
        text: string,
        maxWidth: number,
        font: any,
    ): number {
        let fontSize = CertificateFontSize.NAME_MAX;
        let textWidth = font.widthOfTextAtSize(text, fontSize);

        // Decrease font size until the text fits within maxWidth
        while (
            textWidth > maxWidth &&
            fontSize > CertificateFontSize.NAME_MIN
        ) {
            fontSize -= CertificateFontSize.NAME_STEP;
            textWidth = font.widthOfTextAtSize(text, fontSize);
        }

        return fontSize;
    }

    async generateCertificate(
        name: string,
        cohortType: CohortType,
        certificateType: CertificateType,
    ): Promise<Buffer> {
        try {
            const cohortAbbr = getCohortTypeAbbreviation(cohortType);
            const certificatesPath = join(
                process.cwd(),
                CERTIFICATE_PATHS.certificatesPath,
                certificateType,
            );
            const templatePath = join(certificatesPath, `${cohortAbbr}.pdf`);

            // Read PDF template
            const existingPdfBytes = readFileSync(templatePath);

            // Load a PDFDocument from the existing PDF bytes
            const pdfDoc = await PDFDocument.load(
                new Uint8Array(existingPdfBytes),
            );
            pdfDoc.registerFontkit(fontkit);

            // Embed the custom fonts
            const nautigalFont = await pdfDoc.embedFont(
                new Uint8Array(this.nautigalFontBytes),
            );
            const robotoFont = await pdfDoc.embedFont(
                new Uint8Array(this.robotoFontBytes),
            );

            // Get the first page of the document
            const pages = pdfDoc.getPages();
            const page = pages[0];

            // Create a string of name and measure its width and height in our custom font
            const nameFontSize = this.calculateFontSize(
                name,
                CERTIFICATE_NAME_POSITION.maxWidth!,
                nautigalFont,
            );
            const nameWidth = nautigalFont.widthOfTextAtSize(
                name,
                nameFontSize,
            );

            // Write  name on the page
            page.drawText(name, {
                x: CERTIFICATE_NAME_POSITION.x - nameWidth / 2,
                y: CERTIFICATE_NAME_POSITION.y,
                size: nameFontSize,
                font: nautigalFont,
                color: rgb(
                    CERTIFICATE_TEXT_COLOR.r,
                    CERTIFICATE_TEXT_COLOR.g,
                    CERTIFICATE_TEXT_COLOR.b,
                ),
            });

            const now = new Date();
            const date = now.toLocaleDateString(
                'en-us',
                CERTIFICATE_DATE_FORMAT,
            );
            const dateWidth = robotoFont.widthOfTextAtSize(
                date,
                CERTIFICATE_DATE_POSITION.size,
            );

            // Write date on the page
            page.drawText(date, {
                x: CERTIFICATE_DATE_POSITION.x - dateWidth / 2,
                y: CERTIFICATE_DATE_POSITION.y,
                size: CERTIFICATE_DATE_POSITION.size,
                font: robotoFont,
                color: rgb(
                    CERTIFICATE_TEXT_COLOR.r,
                    CERTIFICATE_TEXT_COLOR.g,
                    CERTIFICATE_TEXT_COLOR.b,
                ),
            });

            // Serialize the PDFDocument to bytes (a Uint8Array)
            const pdfBytes = await pdfDoc.save();

            return Buffer.from(pdfBytes);
        } catch (error) {
            this.logger.error(
                `Failed to generate certificate for ${name}:`,
                error,
            );
            throw error;
        }
    }
}
