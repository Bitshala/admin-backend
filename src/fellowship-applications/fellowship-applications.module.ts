import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FellowshipApplication } from '@/entities/fellowship-application.entity';
import { User } from '@/entities/user.entity';
import { FellowshipApplicationsService } from '@/fellowship-applications/fellowship-applications.service';
import { FellowshipApplicationsController } from '@/fellowship-applications/fellowship-applications.controller';
import { GitHubClassroomClientModule } from '@/github-classroom/client/github-classroom-client.module';
import { MailModule } from '@/mail/mail.module';
import { FellowshipDocumentsModule } from '@/fellowship-documents/fellowship-documents.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([FellowshipApplication, User]),
        MailModule,
        GitHubClassroomClientModule,
        FellowshipDocumentsModule,
    ],
    providers: [FellowshipApplicationsService],
    controllers: [FellowshipApplicationsController],
    exports: [FellowshipApplicationsService],
})
export class FellowshipApplicationsModule {}
