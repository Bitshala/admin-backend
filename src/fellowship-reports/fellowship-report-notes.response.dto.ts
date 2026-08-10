import { FellowshipReportNote } from '@/entities/fellowship-report-note.entity';

export class FellowshipReportNoteResponseDto {
    id!: string;
    reportId!: string;
    body!: string;
    authorId!: string;
    authorName!: string;
    createdAt!: string;
    updatedAt!: string;

    constructor(obj: FellowshipReportNoteResponseDto) {
        this.id = obj.id;
        this.reportId = obj.reportId;
        this.body = obj.body;
        this.authorId = obj.authorId;
        this.authorName = obj.authorName;
        this.createdAt = obj.createdAt;
        this.updatedAt = obj.updatedAt;
    }

    static fromEntity(
        note: FellowshipReportNote,
    ): FellowshipReportNoteResponseDto {
        return new FellowshipReportNoteResponseDto({
            id: note.id,
            reportId: note.report.id,
            body: note.body,
            authorId: note.author.id,
            authorName: note.author.displayName,
            createdAt: note.createdAt.toISOString(),
            updatedAt: note.updatedAt.toISOString(),
        });
    }
}
