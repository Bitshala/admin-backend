import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Feedback } from '@/entities/feedback.entity';
import { User } from '@/entities/user.entity';
import { Cohort } from '@/entities/cohort.entity';
import { ExerciseScore } from '@/entities/exercise-score.entity';
import { FeedbackService } from '@/feedback/feedback.service';
import { FeedbackController } from '@/feedback/feedback.controller';

@Module({
    imports: [
        TypeOrmModule.forFeature([Feedback, User, Cohort, ExerciseScore]),
    ],
    providers: [FeedbackService],
    controllers: [FeedbackController],
    exports: [FeedbackService],
})
export class FeedbackModule {}
