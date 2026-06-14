import { FellowshipType, FellowshipStatus } from '@/common/enum';
import { Fellowship } from '@/entities/fellowship.entity';

export class FellowshipResponseDto {
    id!: string;
    type!: FellowshipType;
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
    driveFolderUrl!: string | null;
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
        this.driveFolderUrl = obj.driveFolderUrl;
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
            driveFolderUrl: fellowship.driveFolderUrl,
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
