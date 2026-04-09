import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FellowshipReport } from '@/entities/fellowship-report.entity';
import { Fellowship } from '@/entities/fellowship.entity';
import { APITask } from '@/entities/api-task.entity';
import { FellowshipReportsService } from '@/fellowship-reports/fellowship-reports.service';
import { FellowshipReportsController } from '@/fellowship-reports/fellowship-reports.controller';
import { MailModule } from '@/mail/mail.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([FellowshipReport, Fellowship, APITask]),
        MailModule,
    ],
    providers: [FellowshipReportsService],
    controllers: [FellowshipReportsController],
    exports: [FellowshipReportsService],
})
export class FellowshipReportsModule {}
