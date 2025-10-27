import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateFeedbackRequestDto {
    @IsUUID()
    @IsNotEmpty()
    userId!: string;

    @IsUUID()
    @IsNotEmpty()
    cohortId!: string;

    @IsString()
    @IsNotEmpty()
    feedbackText!: string;
}
