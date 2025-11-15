import { User } from '@/entities/user.entity';
import { CertificateType } from '@/cetificate/enums/certificate.enum';

export interface UserWithScore {
    user: User;
    totalScore: number;
}

export interface GeneratedCertificate {
    userId: string;
    userName: string;
    certificateType: CertificateType;
    filePath: string;
    downloadPath: string;
}

export interface CertificateGenerationContext {
    name: string;
    cohortId?: string;
    cohortAbbreviation: string;
    certificateType: CertificateType;
    date: string;
}

export interface CertificateTextPosition {
    x: number;
    y: number;
    size: number;
    maxWidth?: number;
}

export interface CertificateFontConfig {
    nautigalFontPath: string;
    robotoFontPath: string;
}

export interface CertificatePathConfig {
    fontsPath: string;
    certificatesPath: string;
    outputPath: string;
}
