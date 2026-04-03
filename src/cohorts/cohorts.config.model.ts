import {
    ArrayMaxSize,
    ArrayMinSize,
    IsArray,
    IsBoolean,
    IsInt,
    IsNumberString,
    IsOptional,
    IsString,
    Max,
    Min,
    ValidateIf,
    ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class QuestionConfig {
    @IsString()
    text!: string;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    attachments?: string[];
}

export class CohortWeekConfig {
    @IsBoolean()
    hasExercise!: boolean;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => QuestionConfig)
    questions!: QuestionConfig[];

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => QuestionConfig)
    bonusQuestions!: QuestionConfig[];
}

export class CohortConfig {
    @IsInt()
    @Min(1)
    @Max(8)
    gdSessions!: number;

    @IsArray()
    @ArrayMinSize(1)
    @ArrayMaxSize(8)
    @ValidateNested({ each: true })
    @Type(() => CohortWeekConfig)
    weeks!: CohortWeekConfig[];

    @IsNumberString({
        no_symbols: true,
        locale: 'en-US',
    })
    @ValidateIf((o: CohortConfig) =>
        o.weeks.some((week: CohortWeekConfig) => week.hasExercise),
    )
    classroomId!: string;
}
