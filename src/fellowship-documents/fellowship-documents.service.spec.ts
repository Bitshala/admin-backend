import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import {
    AcceptedContract,
    FellowshipDocumentsService,
} from '@/fellowship-documents/fellowship-documents.service';
import { FellowshipDocument } from '@/entities/fellowship-document.entity';
import { Fellowship } from '@/entities/fellowship.entity';
import { FellowshipApplication } from '@/entities/fellowship-application.entity';
import { GoogleDriveService } from '@/google-drive/google-drive.service';
import { DbTransactionService } from '@/db-transaction/db-transaction.service';
import { MailService } from '@/mail/mail.service';
import { User } from '@/entities/user.entity';
import {
    AcceptContractMode,
    FellowshipDocumentStatus,
    FellowshipDocumentType,
    FellowshipStatus,
    FellowshipType,
} from '@/common/enum';

// Covers accept-time provisioning for both contract modes: which Drive uploads
// happen, which document rows are written (and their statuses), the resulting
// fellowship status, idempotency, and best-effort folder cleanup on failure.
describe('FellowshipDocumentsService — provisionAcceptedApplication', () => {
    let service: FellowshipDocumentsService;

    const drive = {
        rootFolderId: 'root-folder',
        createFolder: jest.fn(),
        uploadFile: jest.fn(),
        deleteFolder: jest.fn(),
        deleteFile: jest.fn(),
    };

    // A mock EntityManager whose create() echoes its data so tests can inspect
    // exactly what would be persisted, and whose save() is a passthrough.
    const manager = {
        findOne: jest.fn(),
        save: jest.fn(),
        create: jest.fn((_entity: unknown, data: unknown) => data),
        find: jest.fn(),
        update: jest.fn(),
    };

    const dbTransactionService = {
        execute: jest.fn((fn: (m: EntityManager) => Promise<unknown>) =>
            fn(manager as unknown as EntityManager),
        ),
    };

    const reviewer = { id: 'admin-1', displayName: 'Admin' } as unknown as User;
    const applicant = {
        id: 'user-1',
        displayName: 'Alice',
    } as unknown as User;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                FellowshipDocumentsService,
                {
                    provide: getRepositoryToken(FellowshipDocument),
                    useValue: {},
                },
                { provide: getRepositoryToken(Fellowship), useValue: {} },
                { provide: GoogleDriveService, useValue: drive },
                {
                    provide: DbTransactionService,
                    useValue: dbTransactionService,
                },
                { provide: MailService, useValue: {} },
            ],
        }).compile();

        service = module.get(FellowshipDocumentsService);

        // afterEach runs jest.resetAllMocks(), which clears implementations too,
        // so (re)establish every stubbed behavior here in beforeEach.
        dbTransactionService.execute.mockImplementation(
            (fn: (m: EntityManager) => Promise<unknown>) =>
                fn(manager as unknown as EntityManager),
        );
        manager.create.mockImplementation(
            (_entity: unknown, data: unknown) => data,
        );
        manager.save.mockImplementation(async (_e: unknown, x: unknown) => x);
        drive.createFolder.mockResolvedValue('folder-1');
        drive.deleteFolder.mockResolvedValue(undefined);
        // Lock read: an unprovisioned application by default.
        manager.findOne.mockResolvedValue({ id: 'app-1', driveFolderId: null });
    });

    afterEach(() => jest.resetAllMocks());

    function application(): FellowshipApplication {
        return {
            id: 'app-1',
            type: FellowshipType.DEVELOPER,
            applicant,
            driveFolderId: null,
        } as unknown as FellowshipApplication;
    }

    // A minimal stand-in for a multipart PDF part; the buffer passes the %PDF-
    // magic-byte check in assertValidPdf.
    function pdf(originalname: string): Express.Multer.File {
        return {
            buffer: Buffer.from('%PDF-1.4 test'),
            size: 13,
            originalname,
            mimetype: 'application/pdf',
        } as unknown as Express.Multer.File;
    }

    // The single save() payload for a given entity class.
    function saved(entityClass: unknown): unknown {
        const call = manager.save.mock.calls.find((c) => c[0] === entityClass);
        return call?.[1];
    }

    function byType(
        documents: FellowshipDocument[],
    ): Record<string, FellowshipDocument> {
        return Object.fromEntries(documents.map((d) => [d.type, d]));
    }

    describe('PRESIGNED', () => {
        const contract = (): AcceptedContract => ({
            mode: AcceptContractMode.PRESIGNED,
            signedContract: pdf('signed.pdf'),
            w8ben: pdf('w8ben.pdf'),
        });

        it('uploads both files, writes two APPROVED docs, and lands the fellowship in DOCUMENTS_APPROVED', async () => {
            drive.uploadFile
                .mockResolvedValueOnce('signed-file')
                .mockResolvedValueOnce('w8ben-file');

            const fellowship = (await service.provisionAcceptedApplication(
                application(),
                reviewer,
                contract(),
            )) as Fellowship;

            expect(drive.createFolder).toHaveBeenCalledTimes(1);
            expect(drive.uploadFile).toHaveBeenCalledTimes(2);

            expect(fellowship).toMatchObject({
                status: FellowshipStatus.DOCUMENTS_APPROVED,
            });
            expect(saved(Fellowship)).toMatchObject({
                status: FellowshipStatus.DOCUMENTS_APPROVED,
            });

            const documents = saved(FellowshipDocument) as FellowshipDocument[];
            expect(documents).toHaveLength(2);
            const docs = byType(documents);
            expect(
                docs[FellowshipDocumentType.UNSIGNED_CONTRACT],
            ).toBeUndefined();
            expect(docs[FellowshipDocumentType.SIGNED_CONTRACT]).toMatchObject({
                status: FellowshipDocumentStatus.APPROVED,
                driveFileId: 'signed-file',
                uploadedBy: reviewer,
                reviewedBy: reviewer,
            });
            expect(docs[FellowshipDocumentType.W8BEN]).toMatchObject({
                status: FellowshipDocumentStatus.APPROVED,
                driveFileId: 'w8ben-file',
                uploadedBy: reviewer,
                reviewedBy: reviewer,
            });
        });

        it('is idempotent: an already-provisioned application throws Conflict and creates no folder', async () => {
            manager.findOne.mockResolvedValue({
                id: 'app-1',
                driveFolderId: 'existing-folder',
            });

            await expect(
                service.provisionAcceptedApplication(
                    application(),
                    reviewer,
                    contract(),
                ),
            ).rejects.toBeInstanceOf(ConflictException);
            expect(drive.createFolder).not.toHaveBeenCalled();
        });

        it('best-effort deletes the folder when an upload fails', async () => {
            drive.uploadFile
                .mockResolvedValueOnce('signed-file')
                .mockRejectedValueOnce(new Error('drive down'));

            await expect(
                service.provisionAcceptedApplication(
                    application(),
                    reviewer,
                    contract(),
                ),
            ).rejects.toThrow('drive down');
            expect(drive.deleteFolder).toHaveBeenCalledWith('folder-1');
        });
    });

    describe('UNSIGNED', () => {
        it('uploads the unsigned contract and seeds two AWAITING_UPLOAD fellow docs (AWAITING_DOCUMENTS)', async () => {
            drive.uploadFile.mockResolvedValueOnce('unsigned-file');

            const fellowship = (await service.provisionAcceptedApplication(
                application(),
                reviewer,
                {
                    mode: AcceptContractMode.UNSIGNED,
                    unsignedContract: pdf('unsigned.pdf'),
                },
            )) as Fellowship;

            expect(drive.uploadFile).toHaveBeenCalledTimes(1);
            expect(fellowship).toMatchObject({
                status: FellowshipStatus.AWAITING_DOCUMENTS,
            });

            const documents = saved(FellowshipDocument) as FellowshipDocument[];
            expect(documents).toHaveLength(3);
            const docs = byType(documents);
            expect(
                docs[FellowshipDocumentType.UNSIGNED_CONTRACT],
            ).toMatchObject({
                status: FellowshipDocumentStatus.APPROVED,
                driveFileId: 'unsigned-file',
            });
            expect(docs[FellowshipDocumentType.SIGNED_CONTRACT]).toMatchObject({
                status: FellowshipDocumentStatus.AWAITING_UPLOAD,
            });
            expect(docs[FellowshipDocumentType.W8BEN]).toMatchObject({
                status: FellowshipDocumentStatus.AWAITING_UPLOAD,
            });
        });
    });
});
