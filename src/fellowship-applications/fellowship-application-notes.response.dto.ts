import { FellowshipApplicationNote } from '@/entities/fellowship-application-note.entity';

export class FellowshipApplicationNoteResponseDto {
    id!: string;
    applicationId!: string;
    body!: string;
    authorId!: string;
    authorName!: string;
    createdAt!: string;
    updatedAt!: string;

    constructor(obj: FellowshipApplicationNoteResponseDto) {
        this.id = obj.id;
        this.applicationId = obj.applicationId;
        this.body = obj.body;
        this.authorId = obj.authorId;
        this.authorName = obj.authorName;
        this.createdAt = obj.createdAt;
        this.updatedAt = obj.updatedAt;
    }

    static fromEntity(
        note: FellowshipApplicationNote,
    ): FellowshipApplicationNoteResponseDto {
        return new FellowshipApplicationNoteResponseDto({
            id: note.id,
            applicationId: note.application.id,
            body: note.body,
            authorId: note.author.id,
            authorName: note.author.displayName,
            createdAt: note.createdAt.toISOString(),
            updatedAt: note.updatedAt.toISOString(),
        });
    }
}
