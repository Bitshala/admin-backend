import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Feedback } from '@/entities/feedback.entity';
import { Cohort } from '@/entities/cohort.entity';
import { Attendance } from '@/entities/attendance.entity';
import { FeedbackService } from '@/feedback/feedback.service';
import { FeedbackController } from '@/feedback/feedback.controller';

@Module({
    imports: [TypeOrmModule.forFeature([Feedback, Cohort, Attendance])],
    providers: [FeedbackService],
    controllers: [FeedbackController],
    exports: [FeedbackService],
})
export class FeedbackModule {}
