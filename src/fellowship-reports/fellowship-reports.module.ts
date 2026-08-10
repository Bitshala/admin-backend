import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FellowshipReport } from '@/entities/fellowship-report.entity';
import { FellowshipReportNote } from '@/entities/fellowship-report-note.entity';
import { Fellowship } from '@/entities/fellowship.entity';
import { APITask } from '@/entities/api-task.entity';
import { FellowshipReportsService } from '@/fellowship-reports/fellowship-reports.service';
import { FellowshipReportsController } from '@/fellowship-reports/fellowship-reports.controller';
import { FellowshipReportNotesService } from '@/fellowship-reports/fellowship-report-notes.service';
import { FellowshipReportNotesController } from '@/fellowship-reports/fellowship-report-notes.controller';
import { MailModule } from '@/mail/mail.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            FellowshipReport,
            FellowshipReportNote,
            Fellowship,
            APITask,
        ]),
        MailModule,
    ],
    providers: [FellowshipReportsService, FellowshipReportNotesService],
    controllers: [FellowshipReportsController, FellowshipReportNotesController],
    exports: [FellowshipReportsService],
})
export class FellowshipReportsModule {}
