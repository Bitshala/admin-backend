import {
    ArrayMaxSize,
    ArrayMinSize,
    IsArray,
    IsBoolean,
    IsInt,
    IsString,
    Max,
    Min,
    ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CohortWeekConfig {
    @IsBoolean()
    hasExercise!: boolean;

    @IsArray()
    @IsString({ each: true })
    questions!: string[];

    @IsArray()
    @IsString({ each: true })
    bonusQuestions!: string[];
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
}
