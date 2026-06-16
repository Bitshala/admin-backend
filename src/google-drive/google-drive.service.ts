import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Readable } from 'stream';
import type { drive_v3 } from '@googleapis/drive';
import { GOOGLE_DRIVE_INJECTION_TOKEN } from '@/google-drive/client/google-drive-client.constants';

export interface DriveFileMetadata {
    name: string;
    size: number | null;
    mimeType: string | null;
}

/**
 * The sole Google Drive client in the system. Every other layer deals only in
 * our own UUIDs; Drive file/folder IDs never cross an API boundary. Mirrors the
 * way `GitHubClassroomClient` is the only thing that touches Octokit.
 *
 * All calls pass `supportsAllDrives: true` because the files live on a Workspace
 * Shared Drive, not the service account's personal My Drive.
 */
@Injectable()
export class GoogleDriveService {
    private readonly logger = new Logger(GoogleDriveService.name);

    /**
     * Folder under which per-application folders are created. Defaults to the
     * Shared Drive root when no explicit `rootFolderId` is configured.
     */
    readonly rootFolderId: string;

    constructor(
        @Inject(GOOGLE_DRIVE_INJECTION_TOKEN)
        private readonly drive: drive_v3.Drive,
        configService: ConfigService,
    ) {
        const sharedDriveId = configService.getOrThrow<string>(
            'googleDrive.sharedDriveId',
        );
        this.rootFolderId =
            configService.get<string>('googleDrive.rootFolderId') ||
            sharedDriveId;
    }

    /** Creates a folder and returns its Drive folder ID. */
    async createFolder(name: string, parentId: string): Promise<string> {
        const res = await this.drive.files.create({
            requestBody: {
                name,
                mimeType: 'application/vnd.google-apps.folder',
                parents: [parentId],
            },
            fields: 'id',
            supportsAllDrives: true,
        });
        const id = res.data.id;
        if (!id) {
            throw new Error('Google Drive folder creation returned no id');
        }
        return id;
    }

    /** Uploads a new file and returns its Drive file ID. */
    async uploadFile(options: {
        parentId: string;
        name: string;
        mimeType: string;
        body: Readable;
    }): Promise<string> {
        const res = await this.drive.files.create({
            requestBody: {
                name: options.name,
                parents: [options.parentId],
            },
            media: {
                mimeType: options.mimeType,
                body: options.body,
            },
            fields: 'id',
            supportsAllDrives: true,
        });
        const id = res.data.id;
        if (!id) {
            throw new Error('Google Drive file upload returned no id');
        }
        return id;
    }

    /** Replaces a file's content. Drive keeps the previous bytes as a revision. */
    async updateFileContent(
        fileId: string,
        mimeType: string,
        body: Readable,
    ): Promise<void> {
        await this.drive.files.update({
            fileId,
            media: { mimeType, body },
            supportsAllDrives: true,
        });
    }

    /** Streams a file's bytes. */
    async downloadFile(fileId: string): Promise<Readable> {
        const res = await this.drive.files.get(
            { fileId, alt: 'media', supportsAllDrives: true },
            { responseType: 'stream' },
        );
        return res.data as unknown as Readable;
    }

    async getMetadata(fileId: string): Promise<DriveFileMetadata> {
        const res = await this.drive.files.get({
            fileId,
            fields: 'name, size, mimeType',
            supportsAllDrives: true,
        });
        return {
            name: res.data.name ?? '',
            size: res.data.size != null ? Number(res.data.size) : null,
            mimeType: res.data.mimeType ?? null,
        };
    }

    /** Deletes a file. Folders are files in Drive, so {@link deleteFolder} aliases this. */
    async deleteFile(fileId: string): Promise<void> {
        await this.drive.files.delete({ fileId, supportsAllDrives: true });
    }

    async deleteFolder(folderId: string): Promise<void> {
        await this.deleteFile(folderId);
    }
}
