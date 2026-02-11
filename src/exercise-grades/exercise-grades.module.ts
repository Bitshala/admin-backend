import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cohort } from '@/entities/cohort.entity';
import { CohortWeek } from '@/entities/cohort-week.entity';
import { User } from '@/entities/user.entity';
import { ExerciseGradesService } from '@/exercise-grades/exercise-grades.service';
import { ExerciseGradesController } from '@/exercise-grades/exercise-grades.controller';
import { GitHubClientModule } from '@/github-client/github.client.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Cohort, CohortWeek, User]),
        GitHubClientModule,
    ],
    controllers: [ExerciseGradesController],
    providers: [ExerciseGradesService],
    exports: [ExerciseGradesService],
})
export class ExerciseGradesModule {}
