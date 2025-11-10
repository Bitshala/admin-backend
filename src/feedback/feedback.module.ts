import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Feedback } from '@/entities/feedback.entity';
import { Cohort } from '@/entities/cohort.entity';
import { GroupDiscussionScore } from '@/entities/group-discussion-score.entity';
import { FeedbackService } from '@/feedback/feedback.service';
import { FeedbackController } from '@/feedback/feedback.controller';

@Module({
    imports: [
        TypeOrmModule.forFeature([Feedback, Cohort, GroupDiscussionScore]),
    ],
    providers: [FeedbackService],
    controllers: [FeedbackController],
    exports: [FeedbackService],
})
export class FeedbackModule {}
