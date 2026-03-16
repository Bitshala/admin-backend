import { CohortComponent, ComponentRating } from '@/common/enum';
import { Feedback } from '@/entities/feedback.entity';

export class GetFeedbackResponseDto {
    id!: string;
    userName!: string | null;
    userEmail!: string | null;
    componentRatings!: Partial<Record<CohortComponent, ComponentRating>> | null;
    expectations!: string | null;
    improvements!: string | null;
    opportunityInterests!: string[];
    fellowshipInterests!: string[];
    idealProject!: string | null;
    testimonial!: string | null;
    cohortId!: string;
    userId!: string;
    createdAt!: Date;
    updatedAt!: Date;

    constructor(obj: GetFeedbackResponseDto) {
        this.id = obj.id;
        this.userName = obj.userName;
        this.userEmail = obj.userEmail;
        this.componentRatings = obj.componentRatings;
        this.expectations = obj.expectations;
        this.improvements = obj.improvements;
        this.opportunityInterests = obj.opportunityInterests;
        this.fellowshipInterests = obj.fellowshipInterests;
        this.idealProject = obj.idealProject;
        this.testimonial = obj.testimonial;
        this.cohortId = obj.cohortId;
        this.userId = obj.userId;
        this.createdAt = obj.createdAt;
        this.updatedAt = obj.updatedAt;
    }

    static fromEntity(
        feedback: Feedback & {
            user: { id: string; name: string | null; email: string | null };
            cohort: { id: string };
        },
    ): GetFeedbackResponseDto {
        return new GetFeedbackResponseDto({
            id: feedback.id,
            userName: feedback.user.name,
            userEmail: feedback.user.email,
            componentRatings: feedback.componentRatings,
            expectations: feedback.expectations,
            improvements: feedback.improvements,
            opportunityInterests: feedback.opportunityInterests,
            fellowshipInterests: feedback.fellowshipInterests,
            idealProject: feedback.idealProject,
            testimonial: feedback.testimonial,
            cohortId: feedback.cohort.id,
            userId: feedback.user.id,
            createdAt: feedback.createdAt,
            updatedAt: feedback.updatedAt,
        });
    }
}

export class CreateFeedbackResponseDto {
    id!: string;
    message!: string;

    constructor(obj: CreateFeedbackResponseDto) {
        this.id = obj.id;
        this.message = obj.message;
    }
}
