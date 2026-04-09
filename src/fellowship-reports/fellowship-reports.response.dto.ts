import { FellowshipReportStatus } from '@/common/enum';
import { FellowshipReport } from '@/entities/fellowship-report.entity';

export class FellowshipReportContentResponseDto {
    content!: string;

    constructor(content: string) {
        this.content = content;
    }
}

export class FellowshipReportResponseDto {
    id!: string;
    month!: number;
    year!: number;
    status!: FellowshipReportStatus;
    reviewerRemarks!: string | null;
    fellowshipId!: string;
    fellowName!: string;
    reviewedById!: string | null;
    reviewedByName!: string | null;
    createdAt!: string;
    updatedAt!: string;

    constructor(obj: FellowshipReportResponseDto) {
        this.id = obj.id;
        this.month = obj.month;
        this.year = obj.year;
        this.status = obj.status;
        this.reviewerRemarks = obj.reviewerRemarks;
        this.fellowshipId = obj.fellowshipId;
        this.fellowName = obj.fellowName;
        this.reviewedById = obj.reviewedById;
        this.reviewedByName = obj.reviewedByName;
        this.createdAt = obj.createdAt;
        this.updatedAt = obj.updatedAt;
    }

    static fromEntity(report: FellowshipReport): FellowshipReportResponseDto {
        return new FellowshipReportResponseDto({
            id: report.id,
            month: report.month,
            year: report.year,
            status: report.status,
            reviewerRemarks: report.reviewerRemarks,
            fellowshipId: report.fellowship.id,
            fellowName: report.fellowship.user.displayName,
            reviewedById: report.reviewedBy?.id ?? null,
            reviewedByName: report.reviewedBy
                ? report.reviewedBy.displayName
                : null,
            createdAt: report.createdAt.toISOString(),
            updatedAt: report.updatedAt.toISOString(),
        });
    }
}
