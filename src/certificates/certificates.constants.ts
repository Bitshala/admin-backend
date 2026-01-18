import { CertificateTextPosition } from '@/certificates/certificates.interfaces';
import { rgb } from 'pdf-lib';

/**
 * Position and size configuration for the participant's name on the certificate
 */
export const CERTIFICATE_NAME_POSITION: CertificateTextPosition = {
    x: 1510, // X coordinate for name center
    y: 974, // Y coordinate for name
    size: 240, // Starting font size (will be adjusted to fit)
    maxWidth: 1774, // Maximum width for name text
} as const;

/**
 * Position and size configuration for the date on the certificate
 */
export const CERTIFICATE_DATE_POSITION: CertificateTextPosition = {
    x: 848, // X coordinate for date center
    y: 244, // Y coordinate for date
    size: 48, // Font size for date
    maxWidth: 1000, // Maximum width for date text
} as const;

/**
 * RGB color for text on certificates (dark gray)
 */
export const CERTIFICATE_TEXT_COLOR = rgb(0.2, 0.2, 0.2);

/**
 * Font size constraints for participant's name on the certificate
 */
export const CERTIFICATE_FONT_CONSTRAINTS = {
    NAME_MAX: 240,
    NAME_MIN: 10,
    NAME_STEP: 4,
} as const;

/**
 * Number of top performers to be recognized on certificates
 */
export const TOP_PERFORMER_CUTOFF = 3;
