import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cohort } from '@/entities/cohort.entity';
import { CohortWeek } from '@/entities/cohort-week.entity';
import { ExerciseScore } from '@/entities/exercise-score.entity';
import { GitHubClassroomService } from '@/github-classroom/github-classroom.service';
import { GitHubClassroomClientModule } from '@/github-classroom/client/github-classroom-client.module';
import { APITask } from '@/entities/api-task.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([APITask, Cohort, CohortWeek, ExerciseScore]),
        GitHubClassroomClientModule,
    ],
    providers: [GitHubClassroomService],
    exports: [GitHubClassroomService],
})
export class GitHubClassroomModule {}
