import {
    IsArray,
    IsDateString,
    IsInt,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsPositive,
    IsString,
    Min,
} from 'class-validator';

export class CompleteFellowshipOnboardingDto {
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    mentorContact?: string;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    projectName?: string;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    projectGithubLink?: string;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    githubProfile?: string;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    location?: string;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    academicBackground?: string;

    @IsOptional()
    @IsInt()
    @Min(1900)
    graduationYear?: number;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    professionalExperience?: string;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    domains?: string[];

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    codingLanguages?: string[];

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    educationInterests?: string[];

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    bitcoinContributions?: string;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    bitcoinMotivation?: string;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    bitcoinOssGoal?: string;

    @IsOptional()
    @IsString()
    additionalInfo?: string;

    @IsOptional()
    @IsString()
    questionsForBitshala?: string;
}

export class StartFellowshipContractDto {
    @IsDateString({ strict: true })
    startDate!: string;

    @IsDateString({ strict: true })
    endDate!: string;

    @IsNumber({ maxDecimalPlaces: 2 })
    @IsPositive()
    amountUsd!: number;
}
