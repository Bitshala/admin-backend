import {
    FellowshipType,
    FellowshipStatus,
    FellowshipKind,
    EducationCategory,
    CohortType,
} from '@/common/enum';
import { Fellowship } from '@/entities/fellowship.entity';

export class FellowshipResponseDto {
    id!: string;
    type!: FellowshipType;
    kind!: FellowshipKind;
    status!: FellowshipStatus;
    mentorContact!: string | null;
    projectName!: string | null;
    projectGithubLink!: string | null;
    githubProfile!: string | null;
    location!: string | null;
    academicBackground!: string | null;
    graduationYear!: number | null;
    professionalExperience!: string | null;
    domains!: string[] | null;
    codingLanguages!: string[] | null;
    educationInterests!: string[] | null;
    bitcoinContributions!: string | null;
    bitcoinMotivation!: string | null;
    bitcoinOssGoal!: string | null;
    additionalInfo!: string | null;
    questionsForBitshala!: string | null;
    educationCategory!: EducationCategory | null;
    cohortType!: CohortType | null;
    city!: string | null;
    educationCategoryOther!: string | null;
    scopeOfWork!: string | null;
    startDate!: string | null;
    endDate!: string | null;
    amountUsd!: string | null;
    userId!: string;
    userName!: string | null;
    applicationId!: string;
    createdAt!: string;
    updatedAt!: string;

    constructor(obj: FellowshipResponseDto) {
        this.id = obj.id;
        this.type = obj.type;
        this.kind = obj.kind;
        this.status = obj.status;
        this.mentorContact = obj.mentorContact;
        this.projectName = obj.projectName;
        this.projectGithubLink = obj.projectGithubLink;
        this.githubProfile = obj.githubProfile;
        this.location = obj.location;
        this.academicBackground = obj.academicBackground;
        this.graduationYear = obj.graduationYear;
        this.professionalExperience = obj.professionalExperience;
        this.domains = obj.domains;
        this.codingLanguages = obj.codingLanguages;
        this.educationInterests = obj.educationInterests;
        this.bitcoinContributions = obj.bitcoinContributions;
        this.bitcoinMotivation = obj.bitcoinMotivation;
        this.bitcoinOssGoal = obj.bitcoinOssGoal;
        this.additionalInfo = obj.additionalInfo;
        this.questionsForBitshala = obj.questionsForBitshala;
        this.educationCategory = obj.educationCategory;
        this.cohortType = obj.cohortType;
        this.city = obj.city;
        this.educationCategoryOther = obj.educationCategoryOther;
        this.scopeOfWork = obj.scopeOfWork;
        this.startDate = obj.startDate;
        this.endDate = obj.endDate;
        this.amountUsd = obj.amountUsd;
        this.userId = obj.userId;
        this.userName = obj.userName;
        this.applicationId = obj.applicationId;
        this.createdAt = obj.createdAt;
        this.updatedAt = obj.updatedAt;
    }

    // The onboarding/proposal fields now live on the linked application; the two
    // profile fields (location, githubProfile) are sourced from the application
    // handle and the fellow's profile respectively.
    static fromEntity(fellowship: Fellowship): FellowshipResponseDto {
        const application = fellowship.application;
        return new FellowshipResponseDto({
            id: fellowship.id,
            type: fellowship.type,
            kind: fellowship.kind,
            status: fellowship.status,
            mentorContact: application.mentorContact,
            projectName: application.projectName,
            projectGithubLink: application.projectGithubLink,
            githubProfile: application.github,
            location: fellowship.user.location,
            academicBackground: application.academicBackground,
            graduationYear: application.graduationYear,
            professionalExperience: application.professionalExperience,
            domains: application.domains,
            codingLanguages: application.codingLanguages,
            educationInterests: application.educationInterests,
            bitcoinContributions: application.bitcoinContributions,
            bitcoinMotivation: application.bitcoinMotivation,
            bitcoinOssGoal: application.bitcoinOssGoal,
            additionalInfo: application.additionalInfo,
            questionsForBitshala: application.questionsForBitshala,
            educationCategory: application.educationCategory,
            cohortType: application.cohortType,
            city: application.city,
            educationCategoryOther: application.educationCategoryOther,
            scopeOfWork: application.scopeOfWork,
            startDate: fellowship.startDate?.toISOString() ?? null,
            endDate: fellowship.endDate?.toISOString() ?? null,
            amountUsd: fellowship.amountUsd,
            userId: fellowship.user.id,
            userName: fellowship.user.displayName,
            applicationId: application.id,
            createdAt: fellowship.createdAt.toISOString(),
            updatedAt: fellowship.updatedAt.toISOString(),
        });
    }
}
