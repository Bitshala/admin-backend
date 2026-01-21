import { google } from 'googleapis';
import { ConfigService } from '@nestjs/config';

export const GoogleCalendarProvider = {
    provide: 'GOOGLE_CALENDAR',
    inject: [ConfigService],
    useFactory: (configService: ConfigService) => {
        const serviceAccountJson = configService.getOrThrow<string>(
            'google.serviceAccountJson',
        );
        const adminEmail =
            configService.getOrThrow<string>('google.adminEmail');

        const credentials = JSON.parse(serviceAccountJson);

        const auth = new google.auth.GoogleAuth({
            credentials,
            scopes: ['https://www.googleapis.com/auth/calendar'],
            clientOptions: {
                subject: adminEmail,
            },
        });

        return google.calendar({
            version: 'v3',
            auth,
        });
    },
};
