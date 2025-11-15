import { CohortType } from '@/common/enum';
import {
    CertificateTextPosition,
    CertificatePathConfig,
} from '@/cetificate/types/certificate.interface';

/**
 * Mapping of cohort types to their abbreviations used in certificate file names
 */
export const COHORT_TYPE_ABBREVIATION: Record<CohortType, string> = {
    [CohortType.MASTERING_BITCOIN]: 'MB',
    [CohortType.LEARNING_BITCOIN_FROM_COMMAND_LINE]: 'CLI',
    [CohortType.PROGRAMMING_BITCOIN]: 'PB',
    [CohortType.BITCOIN_PROTOCOL_DEVELOPMENT]: 'BPD',
};

/**
 * Position and size configuration for the participant's name on the certificate
 */
export const CERTIFICATE_NAME_POSITION: CertificateTextPosition = {
    x: 1510, // X coordinate for name center
    y: 974, // Y coordinate for name
    size: 240, // Starting font size (will be adjusted to fit)
    maxWidth: 1774, // Maximum width for name text
};

/**
 * Position and size configuration for the date on the certificate
 */
export const CERTIFICATE_DATE_POSITION: CertificateTextPosition = {
    x: 848, // X coordinate for date center
    y: 244, // Y coordinate for date
    size: 48, // Font size for date
};

/**
 * RGB color for text on certificates (dark gray)
 */
export const CERTIFICATE_TEXT_COLOR = {
    r: 0.2,
    g: 0.2,
    b: 0.2,
};

/**
 * Path configurations for certificate assets
 */
export const CERTIFICATE_PATHS: CertificatePathConfig = {
    fontsPath: 'assets/fonts',
    certificatesPath: 'assets/certificates',
    outputPath: 'outputs/certificates',
};

/**
 * Font file names used in certificate generation
 */
export const CERTIFICATE_FONTS = {
    nautigal: 'TheNautigal-Regular.ttf',
    roboto: 'Roboto-VariableFont_wdth,wght.ttf',
};

/**
 * Date format options for certificate date
 */
export const CERTIFICATE_DATE_FORMAT: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
};

/**
 * Helper function to get cohort type abbreviation
 * @param cohortType - The cohort type
 * @returns The abbreviation for the cohort type
 */
export function getCohortTypeAbbreviation(cohortType: CohortType): string {
    const abbreviation = COHORT_TYPE_ABBREVIATION[cohortType];
    if (!abbreviation) {
        throw new Error(`Unknown cohort type: ${cohortType}`);
    }
    return abbreviation;
}

/**
 * Helper function to generate certificate file name
 * @param userId - The user ID
 * @param certificateType - The certificate type
 * @returns The certificate file name
 */
export function generateCertificateFileName(
    userId: string,
    certificateType: string,
): string {
    return `${userId}_${certificateType}.pdf`;
}

/**
 * Helper function to generate certificate download path
 * @param cohortId - The cohort ID
 * @param fileName - The certificate file name
 * @returns The download path
 */
export function generateCertificateDownloadPath(
    cohortId: string,
    fileName: string,
): string {
    return `/certificates/${cohortId}/${fileName}`;
}
