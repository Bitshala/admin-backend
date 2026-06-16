import {
    FellowshipDocumentStatus,
    FellowshipDocumentType,
} from '@/common/enum';
import { FellowshipDocument } from '@/entities/fellowship-document.entity';

// Exposes only our own document UUID and display metadata — never the Drive file ID.
export class FellowshipDocumentResponseDto {
    documentId!: string;
    type!: FellowshipDocumentType;
    status!: FellowshipDocumentStatus;
    fileName!: string | null;
    rejectionReason!: string | null;

    constructor(obj: FellowshipDocumentResponseDto) {
        this.documentId = obj.documentId;
        this.type = obj.type;
        this.status = obj.status;
        this.fileName = obj.fileName;
        this.rejectionReason = obj.rejectionReason;
    }

    static fromEntity(
        document: FellowshipDocument,
    ): FellowshipDocumentResponseDto {
        return new FellowshipDocumentResponseDto({
            documentId: document.id,
            type: document.type,
            status: document.status,
            fileName: document.fileName,
            rejectionReason: document.rejectionReason,
        });
    }
}
