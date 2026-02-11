import { CohortType } from '@/common/enum';

export class StudentGradeDto {
    userId!: string | null;
    name!: string | null;
    githubUsername!: string;
    pointsAwarded!: string;
    pointsAvailable!: string;
    submissionTimestamp!: string;
    studentRepositoryUrl!: string;

    constructor(partial: StudentGradeDto) {
        Object.assign(this, partial);
    }
}

export class WeekExerciseGradesResponseDto {
    weekNumber!: number;
    weekAssignmentLink!: string | null;
    students!: StudentGradeDto[];

    constructor(partial: WeekExerciseGradesResponseDto) {
        Object.assign(this, partial);
    }
}

export class CohortExerciseGradesResponseDto {
    cohortName!: CohortType;
    season!: number;
    weeks!: WeekExerciseGradesResponseDto[];

    constructor(partial: CohortExerciseGradesResponseDto) {
        Object.assign(this, partial);
    }
}
