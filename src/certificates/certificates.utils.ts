import { CohortType } from '@/common/enum';

/**
 * Helper function to generate certificate file name
 * @param userId - The user ID
 * @param cohortType - The cohort type
 * @returns The certificate file name
 */
export function generateCertificateFileName(
    userId: string,
    cohortType: CohortType,
): string {
    return `${userId}_${cohortType.toLowerCase()}.pdf`;
}

/**
 * Helper function to format certificate date
 * @param date - The date to format
 * @returns The formatted date string
 */
export function formatCertificateDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}
