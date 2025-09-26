export class GetCohortWeekResponseDto {
    id!: string;
    week!: number;
    questions!: string[];
    bonusQuestion!: string[];
    classroomUrl!: string | null;
    classroomInviteLink!: string | null;

    constructor(obj: GetCohortWeekResponseDto) {
        this.id = obj.id;
        this.week = obj.week;
        this.questions = obj.questions;
        this.bonusQuestion = obj.bonusQuestion;
        this.classroomUrl = obj.classroomUrl;
        this.classroomInviteLink = obj.classroomInviteLink;
    }
}

export class GetCohortResponseDto {
    id!: string;
    type!: string;
    season!: number;
    startDate!: string;
    endDate!: string;
    registrationDeadline!: string;
    weeks!: GetCohortWeekResponseDto[];

    constructor(obj: GetCohortResponseDto) {
        this.id = obj.id;
        this.type = obj.type;
        this.season = obj.season;
        this.startDate = obj.startDate;
        this.endDate = obj.endDate;
        this.registrationDeadline = obj.registrationDeadline;
        this.weeks = obj.weeks
            .map((week) => new GetCohortWeekResponseDto(week))
            .sort((a, b) => a.week - b.week);
    }
}
