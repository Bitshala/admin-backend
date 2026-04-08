import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FellowshipApplication } from '@/entities/fellowship-application.entity';
import { Fellowship } from '@/entities/fellowship.entity';
import { FellowshipApplicationsService } from '@/fellowship-applications/fellowship-applications.service';
import { FellowshipApplicationsController } from '@/fellowship-applications/fellowship-applications.controller';
import { MailModule } from '@/mail/mail.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([FellowshipApplication, Fellowship]),
        MailModule,
    ],
    providers: [FellowshipApplicationsService],
    controllers: [FellowshipApplicationsController],
    exports: [FellowshipApplicationsService],
})
export class FellowshipApplicationsModule {}
