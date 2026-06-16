import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { drive, auth } from '@googleapis/drive';
import { GOOGLE_DRIVE_INJECTION_TOKEN } from '@/google-drive/client/google-drive-client.constants';
import { GoogleDriveService } from '@/google-drive/google-drive.service';

@Module({
    imports: [ConfigModule],
    providers: [
        {
            provide: GOOGLE_DRIVE_INJECTION_TOKEN,
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => {
                const encodedKey = configService.getOrThrow<string>(
                    'googleDrive.serviceAccountKey',
                );
                let credentials: Record<string, unknown>;
                try {
                    credentials = JSON.parse(
                        Buffer.from(encodedKey, 'base64').toString('utf8'),
                    );
                } catch {
                    throw new Error(
                        'googleDrive.serviceAccountKey must be base64-encoded service-account JSON',
                    );
                }
                const googleAuth = new auth.GoogleAuth({
                    credentials,
                    scopes: ['https://www.googleapis.com/auth/drive'],
                });
                return drive({ version: 'v3', auth: googleAuth });
            },
        },
        GoogleDriveService,
    ],
    exports: [GoogleDriveService],
})
export class GoogleDriveClientModule {}
