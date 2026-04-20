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
        this.startDate = obj.startDate;
        this.endDate = obj.endDate;
        this.amountUsd = obj.amountUsd;
        this.userId = obj.userId;
        this.userName = obj.userName;
        this.applicationId = obj.applicationId;
        this.createdAt = obj.createdAt;
        this.updatedAt = obj.updatedAt;
    }

    static fromEntity(fellowship: Fellowship): FellowshipResponseDto {
        return new FellowshipResponseDto({
            id: fellowship.id,
            type: fellowship.type,
            status: fellowship.status,
            mentorContact: fellowship.mentorContact,
            projectName: fellowship.projectName,
            projectGithubLink: fellowship.projectGithubLink,
            githubProfile: fellowship.githubProfile,
            location: fellowship.location,
            academicBackground: fellowship.academicBackground,
            graduationYear: fellowship.graduationYear,
            professionalExperience: fellowship.professionalExperience,
            domains: fellowship.domains,
            codingLanguages: fellowship.codingLanguages,
            educationInterests: fellowship.educationInterests,
            bitcoinContributions: fellowship.bitcoinContributions,
            bitcoinMotivation: fellowship.bitcoinMotivation,
            bitcoinOssGoal: fellowship.bitcoinOssGoal,
            additionalInfo: fellowship.additionalInfo,
            questionsForBitshala: fellowship.questionsForBitshala,
            startDate: fellowship.startDate?.toISOString() ?? null,
            endDate: fellowship.endDate?.toISOString() ?? null,
            amountUsd: fellowship.amountUsd,
            userId: fellowship.user.id,
            userName: fellowship.user.displayName,
            applicationId: fellowship.application.id,
            createdAt: fellowship.createdAt.toISOString(),
            updatedAt: fellowship.updatedAt.toISOString(),
        });
    }
}
