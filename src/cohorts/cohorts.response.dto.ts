import { CohortType, CohortWeekType } from '@/common/enum';
import { Cohort } from '@/entities/cohort.entity';
import { Question } from '@/entities/cohort-week.entity';

export class GetCohortWeekResponseDto {
    id!: string;
    week!: number;
    type!: CohortWeekType;
    hasExercise!: boolean;
    questions!: Question[];
    bonusQuestion!: Question[];
    classroomInviteLink!: string | null;
    classroomAssignmentUrl!: string | null;
    scheduledDate!: string;

    constructor(obj: GetCohortWeekResponseDto) {
        this.id = obj.id;
        this.week = obj.week;
        this.type = obj.type;
        this.hasExercise = obj.hasExercise;
        this.questions = obj.questions;
        this.bonusQuestion = obj.bonusQuestion;
        this.classroomInviteLink = obj.classroomInviteLink;
        this.classroomAssignmentUrl = obj.classroomAssignmentUrl;
        this.scheduledDate = obj.scheduledDate;
    }
}

export class GetCohortResponseDto {
    id!: string;
    type!: string;
    season!: number;
    startDate!: string;
    endDate!: string;
    registrationDeadline!: string;
    hasExercises!: boolean;
    classroomId!: string | null;
    weeks!: GetCohortWeekResponseDto[];

    constructor(obj: GetCohortResponseDto) {
        this.id = obj.id;
        this.type = obj.type;
        this.season = obj.season;
        this.startDate = obj.startDate;
        this.endDate = obj.endDate;
        this.registrationDeadline = obj.registrationDeadline;
        this.classroomId = obj.classroomId;
        this.weeks = obj.weeks
            .map((week) => new GetCohortWeekResponseDto(week))
            .sort((a, b) => a.week - b.week);
    }

    static fromEntity(cohort: Cohort): GetCohortResponseDto {
        return new GetCohortResponseDto({
            id: cohort.id,
            type: cohort.type,
            season: cohort.season,
            startDate: cohort.startDate.toISOString(),
            endDate: cohort.getEndDate().toISOString(),
            registrationDeadline: cohort.registrationDeadline.toISOString(),
            hasExercises: cohort.hasExercises,
            classroomId: cohort.classroomId ?? null,
            weeks: cohort.weeks.map((week) => ({
                id: week.id,
                week: week.week,
                type: week.type,
                hasExercise: week.hasExercise,
                questions: week.questions || [],
                bonusQuestion: week.bonusQuestion || [],
                classroomInviteLink: week.classroomInviteLink || null,
                classroomAssignmentUrl: week.classroomAssignmentUrl ?? null,
                scheduledDate: week.scheduledDate.toISOString(),
            })),
        });
    }
}

export class PublicCohortResponseDto {
    type!: string;
    season!: number;
    startDate!: string;
    endDate!: string;
    registrationDeadline!: string;

    constructor(obj: PublicCohortResponseDto) {
        this.type = obj.type;
        this.season = obj.season;
        this.startDate = obj.startDate;
        this.endDate = obj.endDate;
        this.registrationDeadline = obj.registrationDeadline;
    }
}

export class ListAvailableCohortsResponseDto {
    [CohortType.MASTERING_LIGHTNING_NETWORK]: PublicCohortResponseDto | null;
    [CohortType.MASTERING_BITCOIN]: PublicCohortResponseDto | null;
    [CohortType.LEARNING_BITCOIN_FROM_COMMAND_LINE]: PublicCohortResponseDto | null;
    [CohortType.PROGRAMMING_BITCOIN]: PublicCohortResponseDto | null;
    [CohortType.BITCOIN_PROTOCOL_DEVELOPMENT]: PublicCohortResponseDto | null;

    constructor(obj: ListAvailableCohortsResponseDto) {
        Object.assign(this, obj);
    }
}

export class UserCohortWaitlistResponseDto {
    cohortWaitlist!: CohortType[];
}
