export class GetFeedbackResponseDto {
    id!: string;
    userName!: string | null;
    userEmail!: string | null;
    feedbackText!: string;
    cohortId!: string;
    userId!: string;
    createdAt!: Date;
    updatedAt!: Date;

    constructor(obj: GetFeedbackResponseDto) {
        this.id = obj.id;
        this.userName = obj.userName;
        this.userEmail = obj.userEmail;
        this.feedbackText = obj.feedbackText;
        this.cohortId = obj.cohortId;
        this.userId = obj.userId;
        this.createdAt = obj.createdAt;
        this.updatedAt = obj.updatedAt;
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
