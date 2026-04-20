import { FellowshipType, FellowshipApplicationStatus } from '@/common/enum';
import { FellowshipApplication } from '@/entities/fellowship-application.entity';

export class FellowshipApplicationProposalResponseDto {
    proposal!: string;

    constructor(proposal: string) {
        this.proposal = proposal;
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
