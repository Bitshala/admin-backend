import { IsNotEmpty, IsString } from 'class-validator';

export class CreateFeedbackRequestDto {
    @IsString()
    @IsNotEmpty()
    feedbackText!: string;
}

export class UpdateFeedbackRequestDto {
    @IsString()
    @IsNotEmpty()
    feedbackText!: string;
}
