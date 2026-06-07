import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FellowshipApplication } from '@/entities/fellowship-application.entity';
import { Fellowship } from '@/entities/fellowship.entity';
import { FellowshipApplicationsService } from '@/fellowship-applications/fellowship-applications.service';
import { FellowshipApplicationsController } from '@/fellowship-applications/fellowship-applications.controller';
import { GitHubClassroomClientModule } from '@/github-classroom/client/github-classroom-client.module';
import { MailModule } from '@/mail/mail.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([FellowshipApplication, Fellowship]),
        MailModule,
        GitHubClassroomClientModule,
    ],
    providers: [FellowshipApplicationsService],
    controllers: [FellowshipApplicationsController],
    exports: [FellowshipApplicationsService],
})
export class FellowshipApplicationsModule {}
