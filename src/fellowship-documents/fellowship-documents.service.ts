import {
    BadRequestException,
    ConflictException,
    ForbiddenException,
    Injectable,
    Logger,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, In, Repository } from 'typeorm';
import { Readable } from 'stream';
import { FellowshipDocument } from '@/entities/fellowship-document.entity';
import { Fellowship } from '@/entities/fellowship.entity';
import { FellowshipApplication } from '@/entities/fellowship-application.entity';
import { User } from '@/entities/user.entity';
import {
    AcceptContractMode,
    FellowshipDocumentStatus,
    FellowshipDocumentType,
    FellowshipKind,
    FellowshipStatus,
    UserRole,
} from '@/common/enum';
import { GoogleDriveService } from '@/google-drive/google-drive.service';
import { DbTransactionService } from '@/db-transaction/db-transaction.service';
import { MailService } from '@/mail/mail.service';
import {
    FellowshipDocumentReviewAction,
    ReviewFellowshipDocumentDto,
} from '@/fellowship-documents/fellowship-documents.request.dto';
import { FellowshipDocumentResponseDto } from '@/fellowship-documents/fellowship-documents.response.dto';

const PDF_MIME_TYPE = 'application/pdf';
// The two documents the fellow uploads; the unsigned contract is Bitshala-provided.
const FELLOW_DOCUMENT_TYPES: FellowshipDocumentType[] = [
    FellowshipDocumentType.SIGNED_CONTRACT,
    FellowshipDocumentType.W8BEN,
];
const DOCUMENT_PHASE_STATUSES: FellowshipStatus[] = [
    FellowshipStatus.AWAITING_DOCUMENTS,
    FellowshipStatus.DOCUMENTS_IN_REVIEW,
    FellowshipStatus.DOCUMENTS_APPROVED,
];

export interface DownloadedDocument {
    stream: Readable;
    fileName: string;
    mimeType: string;
}

/**
 * The contract documents supplied when an admin accepts an application.
 *
 * - UNSIGNED: the standard flow — the admin provides the Bitshala-signed unsigned
 *   contract; the fellow later uploads the signed contract + W-8BEN for review.
 * - PRESIGNED: the contract was signed out of band, so the admin provides the
 *   already-signed contract and the W-8BEN directly and the fellow upload/review
 *   step is skipped.
 */
export type AcceptedContract =
    | {
          mode: AcceptContractMode.UNSIGNED;
          unsignedContract: Express.Multer.File;
      }
    | {
          mode: AcceptContractMode.PRESIGNED;
          signedContract: Express.Multer.File;
          w8ben: Express.Multer.File;
      };

@Injectable()
export class FellowshipDocumentsService {
    private readonly logger = new Logger(FellowshipDocumentsService.name);

    constructor(
        @InjectRepository(FellowshipDocument)
        private readonly documentRepository: Repository<FellowshipDocument>,
        @InjectRepository(Fellowship)
        private readonly fellowshipRepository: Repository<Fellowship>,
        private readonly drive: GoogleDriveService,
        private readonly dbTransactionService: DbTransactionService,
        private readonly mailService: MailService,
    ) {}

    /**
     * Accept-time provisioning, run from the application review flow. Lazily
     * creates the per-application Drive folder, streams in the contract
     * document(s), and writes — in one transaction — the accepted application
     * (with its new `driveFolderId`), the `Fellowship` and the document rows.
     * Drive happens first; on DB failure the folder is best-effort deleted so we
     * never leak an orphan.
     *
     * The document set and starting statuses depend on `contract.mode`:
     * - UNSIGNED: uploads the Bitshala unsigned contract (APPROVED) and seeds the
     *   two fellow documents as AWAITING_UPLOAD; the fellowship starts in
     *   AWAITING_DOCUMENTS and follows the normal upload/review flow.
     * - PRESIGNED: uploads an already-signed contract and W-8BEN, both APPROVED
     *   and reviewed by the admin; no unsigned-contract row is created and the
     *   fellowship starts in DOCUMENTS_APPROVED, ready for start-contract.
     *
     * The caller is expected to have already set `application.status`,
     * `reviewedBy` and `reviewerRemarks`; this method persists them.
     */
    async provisionAcceptedApplication(
        application: FellowshipApplication,
        reviewer: User,
        contract: AcceptedContract,
        kind: FellowshipKind = FellowshipKind.FELLOWSHIP,
    ): Promise<Fellowship> {
        // Content-level %PDF- check on every provided file, before we touch Drive.
        if (contract.mode === AcceptContractMode.PRESIGNED) {
            this.assertValidPdf(contract.signedContract);
            this.assertValidPdf(contract.w8ben);
        } else {
            this.assertValidPdf(contract.unsignedContract);
        }

        // Run folder creation, the Drive upload(s) and the row writes inside one
        // transaction, guarded by a pessimistic lock on the application row. Two
        // concurrent accepts of the same application serialize on the lock; the
        // loser re-reads a non-null driveFolderId and bails before creating
        // anything, so a folder is never orphaned. On any failure we best-effort
        // delete the folder this attempt created (which removes any files in it).
        let createdFolderId: string | null = null;
        try {
            return await this.dbTransactionService.execute(async (manager) => {
                const locked = await manager.findOne(FellowshipApplication, {
                    where: { id: application.id },
                    lock: { mode: 'pessimistic_write' },
                });
                if (!locked) {
                    throw new NotFoundException('Application not found');
                }
                if (locked.driveFolderId) {
                    throw new ConflictException(
                        'This application has already been provisioned',
                    );
                }

                const folderId = await this.drive.createFolder(
                    this.folderName(application),
                    this.drive.rootFolderId,
                );
                createdFolderId = folderId;

                // Drive first: upload every contract document (and build the row
                // specs) before any DB write, so a failed upload rolls back the
                // whole transaction and the best-effort folder delete is the only
                // cleanup needed.
                let fellowshipStatus: FellowshipStatus;
                let documents: FellowshipDocument[];

                if (contract.mode === AcceptContractMode.PRESIGNED) {
                    // Admin-provided, admin-approved: upload the signed contract
                    // and the W-8BEN, mark both APPROVED, and skip the fellow's
                    // upload/review cycle. Both fellow documents approved means the
                    // fellowship lands directly in DOCUMENTS_APPROVED.
                    const signedFileId = await this.drive.uploadFile({
                        parentId: folderId,
                        name: this.documentFileName(
                            FellowshipDocumentType.SIGNED_CONTRACT,
                        ),
                        mimeType: PDF_MIME_TYPE,
                        body: Readable.from(contract.signedContract.buffer),
                    });
                    const w8benFileId = await this.drive.uploadFile({
                        parentId: folderId,
                        name: this.documentFileName(
                            FellowshipDocumentType.W8BEN,
                        ),
                        mimeType: PDF_MIME_TYPE,
                        body: Readable.from(contract.w8ben.buffer),
                    });

                    fellowshipStatus = FellowshipStatus.DOCUMENTS_APPROVED;
                    documents = [
                        manager.create(FellowshipDocument, {
                            application,
                            type: FellowshipDocumentType.SIGNED_CONTRACT,
                            status: FellowshipDocumentStatus.APPROVED,
                            driveFileId: signedFileId,
                            fileName: this.sanitizeFileName(
                                contract.signedContract.originalname,
                                this.documentFileName(
                                    FellowshipDocumentType.SIGNED_CONTRACT,
                                ),
                            ),
                            mimeType: PDF_MIME_TYPE,
                            sizeBytes: contract.signedContract.size,
                            uploadedBy: reviewer,
                            reviewedBy: reviewer,
                        }),
                        manager.create(FellowshipDocument, {
                            application,
                            type: FellowshipDocumentType.W8BEN,
                            status: FellowshipDocumentStatus.APPROVED,
                            driveFileId: w8benFileId,
                            fileName: this.sanitizeFileName(
                                contract.w8ben.originalname,
                                this.documentFileName(
                                    FellowshipDocumentType.W8BEN,
                                ),
                            ),
                            mimeType: PDF_MIME_TYPE,
                            sizeBytes: contract.w8ben.size,
                            uploadedBy: reviewer,
                            reviewedBy: reviewer,
                        }),
                    ];
                } else {
                    // Standard flow: the admin uploads the Bitshala unsigned
                    // contract; the fellow will upload the signed contract +
                    // W-8BEN, which an admin then reviews.
                    const unsignedFileId = await this.drive.uploadFile({
                        parentId: folderId,
                        name: this.documentFileName(
                            FellowshipDocumentType.UNSIGNED_CONTRACT,
                        ),
                        mimeType: PDF_MIME_TYPE,
                        body: Readable.from(contract.unsignedContract.buffer),
                    });

                    fellowshipStatus = FellowshipStatus.AWAITING_DOCUMENTS;
                    documents = [
                        manager.create(FellowshipDocument, {
                            application,
                            type: FellowshipDocumentType.UNSIGNED_CONTRACT,
                            status: FellowshipDocumentStatus.APPROVED,
                            driveFileId: unsignedFileId,
                            fileName: this.documentFileName(
                                FellowshipDocumentType.UNSIGNED_CONTRACT,
                            ),
                            mimeType: PDF_MIME_TYPE,
                            sizeBytes: contract.unsignedContract.size,
                            uploadedBy: reviewer,
                            reviewedBy: reviewer,
                        }),
                        manager.create(FellowshipDocument, {
                            application,
                            type: FellowshipDocumentType.SIGNED_CONTRACT,
                            status: FellowshipDocumentStatus.AWAITING_UPLOAD,
                        }),
                        manager.create(FellowshipDocument, {
                            application,
                            type: FellowshipDocumentType.W8BEN,
                            status: FellowshipDocumentStatus.AWAITING_UPLOAD,
                        }),
                    ];
                }

                application.driveFolderId = folderId;
                await manager.save(FellowshipApplication, application);

                const fellowship = manager.create(Fellowship, {
                    type: application.type,
                    kind,
                    user: application.applicant,
                    application,
                    status: fellowshipStatus,
                });
                await manager.save(Fellowship, fellowship);
                await manager.save(FellowshipDocument, documents);

                return fellowship;
            });
        } catch (err) {
            if (createdFolderId) {
                await this.bestEffortDeleteFolder(createdFolderId);
            }
            throw err;
        }
    }

    async listDocuments(
        fellowshipId: string,
        user: User,
    ): Promise<FellowshipDocumentResponseDto[]> {
        const fellowship = await this.loadFellowship(fellowshipId);
        this.assertAccess(fellowship, user);

        const documents = await this.documentRepository.find({
            where: { application: { id: fellowship.application.id } },
            order: { createdAt: 'ASC' },
        });

        return documents.map(FellowshipDocumentResponseDto.fromEntity);
    }

    async downloadDocument(
        fellowshipId: string,
        documentId: string,
        user: User,
    ): Promise<DownloadedDocument> {
        const { document } = await this.resolveDocument(
            fellowshipId,
            documentId,
            user,
        );

        if (!document.driveFileId) {
            throw new BadRequestException(
                'This document has not been uploaded yet',
            );
        }

        const stream = await this.drive.downloadFile(document.driveFileId);
        return {
            stream,
            fileName: document.fileName ?? this.documentFileName(document.type),
            mimeType: document.mimeType ?? PDF_MIME_TYPE,
        };
    }

    async uploadDocument(
        fellowshipId: string,
        documentId: string,
        user: User,
        file: Express.Multer.File,
    ): Promise<FellowshipDocumentResponseDto> {
        this.assertValidPdf(file);

        const { fellowship, document } = await this.resolveDocument(
            fellowshipId,
            documentId,
            user,
        );

        if (document.type === FellowshipDocumentType.UNSIGNED_CONTRACT) {
            throw new BadRequestException(
                'The unsigned contract is provided by Bitshala and cannot be uploaded by the fellow',
            );
        }
        if (document.status === FellowshipDocumentStatus.APPROVED) {
            throw new BadRequestException(
                'This document has already been approved',
            );
        }

        const folderId = document.application.driveFolderId;
        if (!folderId) {
            throw new BadRequestException(
                'No document folder exists for this fellowship yet',
            );
        }

        // Drive first, DB last. Re-upload reuses the file (new revision, preserving
        // history); a first upload creates the file and is rolled back on DB error.
        let createdFileId: string | null = null;
        if (document.driveFileId) {
            await this.drive.updateFileContent(
                document.driveFileId,
                PDF_MIME_TYPE,
                Readable.from(file.buffer),
            );
        } else {
            createdFileId = await this.drive.uploadFile({
                parentId: folderId,
                name: this.documentFileName(document.type),
                mimeType: PDF_MIME_TYPE,
                body: Readable.from(file.buffer),
            });
            document.driveFileId = createdFileId;
        }

        try {
            document.fileName = this.sanitizeFileName(
                file.originalname,
                this.documentFileName(document.type),
            );
            document.mimeType = PDF_MIME_TYPE;
            document.sizeBytes = file.size;
            document.status = FellowshipDocumentStatus.PENDING_REVIEW;
            document.rejectionReason = null;
            document.uploadedBy = user;

            await this.dbTransactionService.execute(async (manager) => {
                // Lock before the write: the sync below reads this document's
                // sibling, so a concurrent upload of the other document must
                // not interleave between our save and our read.
                const locked = await this.lockFellowship(
                    manager,
                    fellowship.id,
                );
                await manager.save(FellowshipDocument, document);
                await this.syncFellowshipStatus(
                    manager,
                    locked,
                    document.application.id,
                );
            });
        } catch (err) {
            if (createdFileId) {
                await this.bestEffortDeleteFile(createdFileId);
            }
            throw err;
        }

        return FellowshipDocumentResponseDto.fromEntity(document);
    }

    async reviewDocument(
        fellowshipId: string,
        documentId: string,
        reviewer: User,
        dto: ReviewFellowshipDocumentDto,
    ): Promise<FellowshipDocumentResponseDto> {
        const { fellowship, document } = await this.resolveDocument(
            fellowshipId,
            documentId,
            reviewer,
        );

        if (document.type === FellowshipDocumentType.UNSIGNED_CONTRACT) {
            throw new BadRequestException(
                'The unsigned contract is not subject to review',
            );
        }
        if (document.status !== FellowshipDocumentStatus.PENDING_REVIEW) {
            throw new BadRequestException(
                'Only documents pending review can be approved or rejected',
            );
        }

        if (dto.action === FellowshipDocumentReviewAction.APPROVE) {
            document.status = FellowshipDocumentStatus.APPROVED;
            document.rejectionReason = null;
        } else {
            if (!dto.rejectionReason) {
                throw new BadRequestException(
                    'A reason is required when rejecting a document',
                );
            }
            document.status = FellowshipDocumentStatus.REJECTED;
            document.rejectionReason = dto.rejectionReason;
        }
        document.reviewedBy = reviewer;

        await this.dbTransactionService.execute(async (manager) => {
            const locked = await this.lockFellowship(manager, fellowship.id);
            await manager.save(FellowshipDocument, document);
            await this.syncFellowshipStatus(
                manager,
                locked,
                document.application.id,
            );
        });

        if (dto.action === FellowshipDocumentReviewAction.REJECT) {
            const fellow = fellowship.user;
            if (fellow.email) {
                try {
                    await this.mailService.sendFellowshipDocumentRejectedEmail(
                        fellow.email,
                        fellow.displayName,
                        this.documentDisplayName(document.type),
                        dto.rejectionReason!,
                        fellowship.id,
                    );
                } catch (err) {
                    this.logger.error(
                        `Failed to send document-rejected email to ${fellow.email}`,
                        (err as Error).stack,
                    );
                }
            }
        }

        return FellowshipDocumentResponseDto.fromEntity(document);
    }

    // --- helpers -----------------------------------------------------------

    private async loadFellowship(fellowshipId: string): Promise<Fellowship> {
        const fellowship = await this.fellowshipRepository.findOne({
            where: { id: fellowshipId },
            relations: { user: true, application: true },
        });
        if (!fellowship) {
            throw new NotFoundException('Fellowship not found');
        }
        return fellowship;
    }

    private assertAccess(fellowship: Fellowship, user: User): void {
        if (fellowship.user.id !== user.id && user.role !== UserRole.ADMIN) {
            throw new ForbiddenException();
        }
    }

    /**
     * Resolves a document strictly within the addressed fellowship: the document
     * must belong to that fellowship's application, so a valid document ID from a
     * different fellowship is a 404, not a leak.
     */
    private async resolveDocument(
        fellowshipId: string,
        documentId: string,
        user: User,
    ): Promise<{ fellowship: Fellowship; document: FellowshipDocument }> {
        const fellowship = await this.loadFellowship(fellowshipId);
        this.assertAccess(fellowship, user);

        const document = await this.documentRepository.findOne({
            where: {
                id: documentId,
                application: { id: fellowship.application.id },
            },
            relations: { application: true },
        });
        if (!document) {
            throw new NotFoundException('Document not found');
        }
        return { fellowship, document };
    }

    /**
     * Takes a row-level write lock on the fellowship, serialising every
     * document mutation for that fellowship. `fellowship.applicationId` is
     * UNIQUE, so the fellowship row is a valid mutex for its application's
     * document rows too.
     *
     * Deliberately loads no relations: TypeORM turns this into
     * `SELECT ... FOR UPDATE`, which Postgres rejects against an outer join.
     */
    private async lockFellowship(
        manager: EntityManager,
        fellowshipId: string,
    ): Promise<Fellowship> {
        const locked = await manager.findOne(Fellowship, {
            where: { id: fellowshipId },
            lock: { mode: 'pessimistic_write' },
        });
        if (!locked) {
            throw new NotFoundException('Fellowship not found');
        }
        return locked;
    }

    /**
     * Recomputes the fellowship's document-phase status from its two fellow
     * documents. Leaves ACTIVE/COMPLETED fellowships untouched.
     *
     * Expects `fellowship` to have been loaded under `lockFellowship` in this
     * same transaction — re-reading it here would race with a concurrent
     * mutation of the sibling document.
     */
    private async syncFellowshipStatus(
        manager: EntityManager,
        fellowship: Fellowship,
        applicationId: string,
    ): Promise<void> {
        if (!DOCUMENT_PHASE_STATUSES.includes(fellowship.status)) {
            this.logger.warn(
                `Skipping status sync for fellowship ${fellowship.id}: status ${fellowship.status} is outside the document phase`,
            );
            return;
        }

        const documents = await manager.find(FellowshipDocument, {
            where: {
                application: { id: applicationId },
                type: In(FELLOW_DOCUMENT_TYPES),
            },
        });

        const bothPresent = documents.length === FELLOW_DOCUMENT_TYPES.length;
        const statuses = documents.map((d) => d.status);
        const allApproved =
            bothPresent &&
            statuses.every((s) => s === FellowshipDocumentStatus.APPROVED);
        const allUploaded =
            bothPresent &&
            statuses.every(
                (s) =>
                    s === FellowshipDocumentStatus.PENDING_REVIEW ||
                    s === FellowshipDocumentStatus.APPROVED,
            );

        const next = allApproved
            ? FellowshipStatus.DOCUMENTS_APPROVED
            : allUploaded
              ? FellowshipStatus.DOCUMENTS_IN_REVIEW
              : FellowshipStatus.AWAITING_DOCUMENTS;

        if (fellowship.status !== next) {
            // Targeted update, not save(): a full-entity write would clobber
            // startDate/endDate/amountUsd set by a concurrent startContract.
            await manager.update(Fellowship, fellowship.id, { status: next });
            this.logger.log(
                `Fellowship ${fellowship.id} status ${fellowship.status} -> ${next}`,
            );
            fellowship.status = next;
        }
    }

    private assertValidPdf(file: Express.Multer.File | undefined): void {
        if (!file || !file.buffer || file.buffer.length === 0) {
            throw new BadRequestException('A PDF file is required');
        }
        // Client-declared mime is untrusted — verify the %PDF- magic bytes.
        if (file.buffer.subarray(0, 5).toString('latin1') !== '%PDF-') {
            throw new BadRequestException('Uploaded file is not a valid PDF');
        }
    }

    private folderName(application: FellowshipApplication): string {
        const owner =
            application.applicant?.displayName ?? application.applicant?.id;
        return `${owner} — ${application.type} — (${application.id})`;
    }

    // Stored display name for a fellow-uploaded file. The client-supplied name is
    // untrusted, so we drop any path components and characters that don't belong
    // in a download name (control chars and the quote/backslash that would break
    // the quoted Content-Disposition header), cap the length, and fall back to a
    // safe default.
    private sanitizeFileName(
        name: string | undefined,
        fallback: string,
    ): string {
        if (!name) {
            return fallback;
        }
        const base = name.replace(/^.*[\\/]/, '');
        // eslint-disable-next-line no-control-regex
        const cleaned = base
            .replace(/[\x00-\x1f"\\]/g, '')
            .trim()
            .slice(0, 200);
        return cleaned || fallback;
    }

    private documentFileName(type: FellowshipDocumentType): string {
        switch (type) {
            case FellowshipDocumentType.UNSIGNED_CONTRACT:
                return 'unsigned-contract.pdf';
            case FellowshipDocumentType.SIGNED_CONTRACT:
                return 'signed-contract.pdf';
            case FellowshipDocumentType.W8BEN:
                return 'w8ben.pdf';
        }
    }

    private documentDisplayName(type: FellowshipDocumentType): string {
        switch (type) {
            case FellowshipDocumentType.UNSIGNED_CONTRACT:
                return 'Unsigned contract';
            case FellowshipDocumentType.SIGNED_CONTRACT:
                return 'Signed contract';
            case FellowshipDocumentType.W8BEN:
                return 'W-8BEN form';
        }
    }

    private async bestEffortDeleteFile(fileId: string): Promise<void> {
        await this.drive
            .deleteFile(fileId)
            .catch((err) =>
                this.logger.error(
                    `Failed to clean up Drive file ${fileId}`,
                    (err as Error).stack,
                ),
            );
    }

    private async bestEffortDeleteFolder(folderId: string): Promise<void> {
        await this.drive
            .deleteFolder(folderId)
            .catch((err) =>
                this.logger.error(
                    `Failed to clean up Drive folder ${folderId}`,
                    (err as Error).stack,
                ),
            );
    }
}
