import { Module } from '@nestjs/common';
import { ScoresService } from '@/scores/scores.service';
import { ScoresController } from '@/scores/scores.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '@/entities/user.entity';
import { GroupDiscussionScore } from '@/entities/group-discussion-score.entity';
import { ExerciseScore } from '@/entities/exercise-score.entity';
import { Cohort } from '@/entities/cohort.entity';
import { CohortWeek } from '@/entities/cohort-week.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            User,
            GroupDiscussionScore,
            ExerciseScore,
            Cohort,
            CohortWeek,
        ]),
    ],
    controllers: [ScoresController],
    providers: [ScoresService],
    exports: [ScoresService],
})
export class ScoresModule {}
