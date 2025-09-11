import { Module } from '@nestjs/common';
import { ScoresService } from '@/scores/scores.service';
import { ScoresController } from '@/scores/scores.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '@/entities/user.entity';
import { GroupDiscussionScore } from '@/entities/group-discussion-score.entity';
import { ExerciseScore } from '@/entities/exercise-score.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([User, GroupDiscussionScore, ExerciseScore]),
    ],
    controllers: [ScoresController],
    providers: [ScoresService],
    exports: [ScoresService],
})
export class ScoresModule {}
