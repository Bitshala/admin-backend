import { CohortType, CohortWeekType, UserRole } from '@/common/enum';
import { Cohort } from '@/entities/cohort.entity';
import {
    Exercise,
    Question,
    ReadingMaterial,
} from '@/entities/cohort-week.entity';
import { getCohortFullName } from '@/common/cohort-display';
import {
    canViewBonusQuestions,
    filterLinksByRole,
} from '@/cohorts/cohort-access.util';

export interface CohortLink {
    label: string;
    url: string;
}

export class GetCohortWeekResponseDto {
    id!: string;
    week!: number;
    type!: CohortWeekType;
    hasExercise!: boolean;
    title!: string | null;
    questions!: Question[];
    bonusQuestions!: Question[];
    readingMaterial!: ReadingMaterial[];
    activity!: string | null;
    exercise!: Exercise | null;
    classroomInviteLink!: string | null;
    classroomAssignmentUrl!: string | null;
    scheduledDate!: string;

    constructor(obj: GetCohortWeekResponseDto) {
        this.id = obj.id;
        this.week = obj.week;
        this.type = obj.type;
        this.hasExercise = obj.hasExercise;
        this.title = obj.title;
        this.questions = obj.questions;
        this.bonusQuestions = obj.bonusQuestions;
        this.readingMaterial = obj.readingMaterial;
        this.activity = obj.activity;
        this.exercise = obj.exercise;
        this.classroomInviteLink = obj.classroomInviteLink;
        this.classroomAssignmentUrl = obj.classroomAssignmentUrl;
        this.scheduledDate = obj.scheduledDate;
    }
}

export class GetCohortResponseDto {
    id!: string;
    type!: string;
    displayName!: string;
    season!: number;
    startDate!: string;
    endDate!: string;
    registrationDeadline!: string;
    hasExercises!: boolean;
    classroomId!: string | null;
    links!: CohortLink[];
    weeks!: GetCohortWeekResponseDto[];

    constructor(obj: GetCohortResponseDto) {
        this.id = obj.id;
        this.type = obj.type;
        this.displayName = obj.displayName;
        this.season = obj.season;
        this.startDate = obj.startDate;
        this.endDate = obj.endDate;
        this.registrationDeadline = obj.registrationDeadline;
        this.hasExercises = obj.hasExercises;
        this.classroomId = obj.classroomId;
        this.links = obj.links;
        this.weeks = obj.weeks
            .map((week) => new GetCohortWeekResponseDto(week))
            .sort((a, b) => a.week - b.week);
    }

    // Maps the entity to the role-gated response DTO. `role` is required, so a
    // gated DTO can never be constructed without it (a missed call site is a
    // compile error, not a silent leak). Arrays are deep-copied so the response
    // never aliases (and can never mutate) entity state.
    static fromEntity(cohort: Cohort, role: UserRole): GetCohortResponseDto {
        const canSeeBonus = canViewBonusQuestions(role);

        return new GetCohortResponseDto({
            id: cohort.id,
            type: cohort.type,
            displayName: getCohortFullName(cohort.type),
            season: cohort.season,
            startDate: cohort.startDate.toISOString(),
            endDate: cohort.getEndDate().toISOString(),
            registrationDeadline: cohort.registrationDeadline.toISOString(),
            hasExercises: cohort.hasExercises,
            classroomId: cohort.classroomId ?? null,
            // Links are filtered by role; minRole is dropped from the response.
            links: filterLinksByRole(cohort.links ?? [], role).map((link) => ({
                label: link.label,
                url: link.url,
            })),
            weeks: cohort.weeks.map((week) => ({
                id: week.id,
                week: week.week,
                type: week.type,
                hasExercise: week.hasExercise,
                title: week.title ?? null,
                questions: (week.questions || []).map((q) => ({
                    text: q.text,
                    attachments: [...(q.attachments ?? [])],
                })),
                // Bonus questions are staff-only; hidden from students.
                bonusQuestions: canSeeBonus
                    ? (week.bonusQuestions || []).map((q) => ({
                          text: q.text,
                          attachments: [...(q.attachments ?? [])],
                      }))
                    : [],
                readingMaterial: (week.readingMaterial || []).map((r) => ({
                    label: r.label,
                    url: r.url,
                })),
                activity: week.activity ?? null,
                exercise: week.exercise
                    ? {
                          title: week.exercise.title,
                          concepts: week.exercise.concepts,
                          problem: week.exercise.problem,
                          expectedOutput: [...week.exercise.expectedOutput],
                      }
                    : null,
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
    [CohortType.RUST_FOR_BITCOIN]: PublicCohortResponseDto | null;

    constructor(obj: ListAvailableCohortsResponseDto) {
        Object.assign(this, obj);
    }
}

export class UserCohortWaitlistResponseDto {
    cohortWaitlist!: CohortType[];
}
