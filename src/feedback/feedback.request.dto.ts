import { IsEmail, IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateFeedbackRequestDto {
    @IsString()
    @IsNotEmpty()
    preferredName!: string;

    @IsEmail()
    @IsNotEmpty()
    email!: string;

    @IsUUID()
    @IsNotEmpty()
    cohortId!: string;

    @IsString()
    @IsNotEmpty()
    feedbackText!: string;
}
