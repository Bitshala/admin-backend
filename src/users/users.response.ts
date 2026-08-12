// dto/get-user.response.ts
import { User } from '@/entities/user.entity';
import {
    CertificateType,
    CohortType,
    FellowshipStatus,
    TopPerformerRank,
    UserRole,
} from '@/common/enum';
import { GetCertificateResponseDto } from '@/certificates/certificates.response.dto';
import { GetUsersScoresResponseDto } from '@/scores/scores.response.dto';
import { FellowshipResponseDto } from '@/fellowships/fellowships.response.dto';

export class GetUserResponse {
    id: string;
    email: string | null;
    discordUsername: string;
    discordGlobalName: string | null;
    name: string | null;
    role: string;
    description: string | null;
    background: string | null;
    githubProfileUrl: string | null;
    portfolioUrl: string | null;
    linkedinProfileUrl: string | null;
    skills: string[] | null;
    // ISO date (YYYY-MM-DD) of when first heard about Bitcoin
    firstHeardAboutBitcoinOn: string | null;
    bitcoinBooksRead: string[] | null;
    whyBitcoin: string | null;
    weeklyCohortCommitmentHours: number | null;
    location: string | null;
    referral: string | null;

    constructor(partial: Partial<GetUserResponse>) {
        Object.assign(this, partial);
    }

    static fromEntity(user: User): GetUserResponse {
        return new GetUserResponse({
            id: user.id,
            email: user.email,
            discordUsername: user.discordUserName,
            discordGlobalName: user.discordGlobalName,
            name: user.name,
            role: user.role,
            description: user.description,
            background: user.background,
            githubProfileUrl: user.githubProfileUrl,
            portfolioUrl: user.portfolioUrl,
            linkedinProfileUrl: user.linkedinProfileUrl,
            skills: user.skills,
            firstHeardAboutBitcoinOn: user.firstHeardAboutBitcoinOn,
            bitcoinBooksRead: user.bitcoinBooksRead,
            whyBitcoin: user.whyBitcoin,
            weeklyCohortCommitmentHours: user.weeklyCohortCommitmentHours,
            location: user.location,
            referral: user.referral,
        });
    }
}

export class UserSummaryResponseDto {
    id: string;
    displayName: string;
    name: string | null;
    email: string | null;
    discordUsername: string;
    discordGlobalName: string | null;
    role: UserRole;
    createdAt: string;

    constructor(partial: Partial<UserSummaryResponseDto>) {
        Object.assign(this, partial);
    }

    static fromEntity(user: User): UserSummaryResponseDto {
        return new UserSummaryResponseDto({
            id: user.id,
            displayName: user.displayName,
            name: user.name,
            email: user.email,
            discordUsername: user.discordUserName,
            discordGlobalName: user.discordGlobalName,
            role: user.role,
            createdAt: user.createdAt.toISOString(),
        });
    }
}

export class UserCohortCertificateDto {
    certificateType: CertificateType;
    rank: TopPerformerRank | null;
    withExercises: boolean;
    issuedAt: string;

    constructor(partial: Partial<UserCohortCertificateDto>) {
        Object.assign(this, partial);
    }
}

export class UserCohortParticipationDto {
    cohortId: string;
    cohortType: CohortType;
    seasonNumber: number;
    totalScore: number;
    maxTotalScore: number;
    scorePercent: number;
    attendedWeeks: number;
    totalWeeks: number;
    attendancePercent: number;
    // A cohort counts as completed once the user has earned a certificate for it.
    completed: boolean;
    certificate: UserCohortCertificateDto | null;

    constructor(partial: Partial<UserCohortParticipationDto>) {
        Object.assign(this, partial);
    }
}

export class UserOverviewResponseDto {
    profile: GetUserResponse;
    joinedAt: string;
    isGuildMember: boolean;
    cohortSummary: { enrolledCount: number; completedCount: number };
    cohorts: UserCohortParticipationDto[];
    fellowshipSummary: { totalCount: number; completedCount: number };
    fellowships: FellowshipResponseDto[];

    constructor(partial: Partial<UserOverviewResponseDto>) {
        Object.assign(this, partial);
    }

    static fromParts(
        user: User,
        scores: GetUsersScoresResponseDto,
        certificates: GetCertificateResponseDto[],
        fellowships: FellowshipResponseDto[],
    ): UserOverviewResponseDto {
        const certificateByCohortId = new Map(
            certificates.map((certificate) => [
                certificate.cohortId,
                certificate,
            ]),
        );

        const cohorts = scores.cohorts.map((cohort) => {
            const certificate =
                certificateByCohortId.get(cohort.cohortId) ?? null;
            return new UserCohortParticipationDto({
                cohortId: cohort.cohortId,
                cohortType: cohort.cohortType,
                seasonNumber: cohort.seasonNumber,
                totalScore: cohort.totalScore,
                maxTotalScore: cohort.maxTotalScore,
                scorePercent: cohort.scorePercent,
                attendedWeeks: cohort.attendedWeeks,
                totalWeeks: cohort.totalWeeks,
                attendancePercent: cohort.attendancePercent,
                completed: certificate !== null,
                certificate: certificate
                    ? new UserCohortCertificateDto({
                          certificateType: certificate.certificateType,
                          rank: certificate.rank,
                          withExercises: certificate.withExercises,
                          issuedAt: certificate.createdAt,
                      })
                    : null,
            });
        });

        return new UserOverviewResponseDto({
            profile: GetUserResponse.fromEntity(user),
            joinedAt: user.createdAt.toISOString(),
            isGuildMember: user.isGuildMember,
            cohortSummary: {
                enrolledCount: cohorts.length,
                completedCount: cohorts.filter((cohort) => cohort.completed)
                    .length,
            },
            cohorts,
            fellowshipSummary: {
                totalCount: fellowships.length,
                completedCount: fellowships.filter(
                    (fellowship) =>
                        fellowship.status === FellowshipStatus.COMPLETED,
                ).length,
            },
            fellowships,
        });
    }
}
