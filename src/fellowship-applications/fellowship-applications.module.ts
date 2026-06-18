import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FellowshipApplication } from '@/entities/fellowship-application.entity';
import { FellowshipApplicationNote } from '@/entities/fellowship-application-note.entity';
import { User } from '@/entities/user.entity';
import { FellowshipApplicationsService } from '@/fellowship-applications/fellowship-applications.service';
import { FellowshipApplicationsController } from '@/fellowship-applications/fellowship-applications.controller';
import { FellowshipApplicationNotesService } from '@/fellowship-applications/fellowship-application-notes.service';
import { FellowshipApplicationNotesController } from '@/fellowship-applications/fellowship-application-notes.controller';
import { GitHubClassroomClientModule } from '@/github-classroom/client/github-classroom-client.module';
import { MailModule } from '@/mail/mail.module';
import { FellowshipDocumentsModule } from '@/fellowship-documents/fellowship-documents.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            FellowshipApplication,
            FellowshipApplicationNote,
            User,
        ]),
        MailModule,
        GitHubClassroomClientModule,
        FellowshipDocumentsModule,
    ],
    providers: [
        FellowshipApplicationsService,
        FellowshipApplicationNotesService,
    ],
    controllers: [
        FellowshipApplicationsController,
        FellowshipApplicationNotesController,
    ],
    exports: [FellowshipApplicationsService],
})
export class FellowshipApplicationsModule {}
