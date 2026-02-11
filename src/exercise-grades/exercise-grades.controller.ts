import {
    Controller,
    Get,
    Param,
    ParseUUIDPipe,
    UsePipes,
    ValidationPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '@/auth/roles.decorator';
import { UserRole } from '@/common/enum';
import { ExerciseGradesService } from '@/exercise-grades/exercise-grades.service';
import {
    CohortExerciseGradesResponseDto,
    WeekExerciseGradesResponseDto,
} from '@/exercise-grades/exercise-grades.response.dto';

@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@ApiTags('Exercise Grades')
@ApiBearerAuth()
@Controller('exercise-grades')
export class ExerciseGradesController {
    constructor(
        private readonly exerciseGradesService: ExerciseGradesService,
    ) {}

    @Get('cohort/:cohortId')
    @ApiOperation({
        summary:
            'Fetch exercise grades from GitHub Classroom for all weeks of a cohort',
    })
    @Roles(UserRole.TEACHING_ASSISTANT, UserRole.ADMIN)
    async getExerciseGradesForCohort(
        @Param('cohortId', new ParseUUIDPipe()) cohortId: string,
    ): Promise<CohortExerciseGradesResponseDto> {
        return this.exerciseGradesService.getExerciseGradesForCohort(cohortId);
    }

    @Get('cohort/:cohortId/week/:weekId')
    @ApiOperation({
        summary:
            'Fetch exercise grades from GitHub Classroom for a specific week of a cohort',
    })
    @Roles(UserRole.TEACHING_ASSISTANT, UserRole.ADMIN)
    async getExerciseGradesForCohortWeek(
        @Param('cohortId', new ParseUUIDPipe()) cohortId: string,
        @Param('weekId', new ParseUUIDPipe()) weekId: string,
    ): Promise<WeekExerciseGradesResponseDto> {
        return this.exerciseGradesService.getExerciseGradesForCohortWeek(
            cohortId,
            weekId,
        );
    }
}
