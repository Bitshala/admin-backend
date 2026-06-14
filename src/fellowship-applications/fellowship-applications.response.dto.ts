import { FellowshipType, FellowshipApplicationStatus } from '@/common/enum';
import { FellowshipApplication } from '@/entities/fellowship-application.entity';

export class FellowshipApplicationProposalResponseDto {
    title!: string | null;
    problemStatement!: string | null;
    plan!: string | null;
    mentorName!: string | null;
    mentorContact!: string | null;
    mentorTestimonial!: string | null;
    github!: string | null;
    links!: string[];
    projectName!: string | null;
    projectGithubLink!: string | null;
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

    static fromEntity(
        application: FellowshipApplication,
    ): FellowshipApplicationProposalResponseDto {
        const dto = new FellowshipApplicationProposalResponseDto();
        dto.title = application.title;
        dto.problemStatement = application.problemStatement;
        dto.plan = application.plan;
        dto.mentorName = application.mentorName;
        dto.mentorContact = application.mentorContact;
        dto.mentorTestimonial = application.mentorTestimonial;
        dto.github = application.github;
        dto.links = application.links ?? [];
        dto.projectName = application.projectName;
        dto.projectGithubLink = application.projectGithubLink;
        dto.academicBackground = application.academicBackground;
        dto.graduationYear = application.graduationYear;
        dto.professionalExperience = application.professionalExperience;
        dto.domains = application.domains;
        dto.codingLanguages = application.codingLanguages;
        dto.educationInterests = application.educationInterests;
        dto.bitcoinContributions = application.bitcoinContributions;
        dto.bitcoinMotivation = application.bitcoinMotivation;
        dto.bitcoinOssGoal = application.bitcoinOssGoal;
        dto.additionalInfo = application.additionalInfo;
        dto.questionsForBitshala = application.questionsForBitshala;
        return dto;
    }
}

export class GithubUserCheckResponseDto {
    // true/false when GitHub answered; null when the check could not be
    // performed — clients must treat null as "unknown", never "missing".
    exists!: boolean | null;

    constructor(exists: boolean | null) {
        this.exists = exists;
    }
}

export class FellowshipApplicationResponseDto {
    id!: string;
    type!: FellowshipType;
    status!: FellowshipApplicationStatus;
    reviewerRemarks!: string | null;
    applicantId!: string;
    applicantName!: string | null;
    reviewedById!: string | null;
    reviewedByName!: string | null;
    createdAt!: string;
    updatedAt!: string;

    constructor(obj: FellowshipApplicationResponseDto) {
        this.id = obj.id;
        this.type = obj.type;
        this.status = obj.status;
        this.reviewerRemarks = obj.reviewerRemarks;
        this.applicantId = obj.applicantId;
        this.applicantName = obj.applicantName;
        this.reviewedById = obj.reviewedById;
        this.reviewedByName = obj.reviewedByName;
        this.createdAt = obj.createdAt;
        this.updatedAt = obj.updatedAt;
    }

    static fromEntity(
        application: FellowshipApplication,
    ): FellowshipApplicationResponseDto {
        return new FellowshipApplicationResponseDto({
            id: application.id,
            type: application.type,
            status: application.status,
            reviewerRemarks: application.reviewerRemarks,
            applicantId: application.applicant.id,
            applicantName: application.applicant.displayName,
            reviewedById: application.reviewedBy?.id ?? null,
            reviewedByName: application.reviewedBy
                ? application.reviewedBy.displayName
                : null,
            createdAt: application.createdAt.toISOString(),
            updatedAt: application.updatedAt.toISOString(),
        });
    }
}
