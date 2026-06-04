import {
    ArrayMaxSize,
    ArrayMinSize,
    IsArray,
    IsBoolean,
    IsDefined,
    IsEnum,
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
import { UserRole } from '@/common/enum';

export class QuestionConfig {
    @IsString()
    text!: string;

    // Optional file names, relative to the cohort's attachments directory
    // (assets/cohort-configs/attachments/<cohort>/). Each must exist on disk.
    // Omit when the question has no attachments.
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    attachments?: string[];
}

export class ReadingMaterialConfig {
    @IsString()
    label!: string;

    @IsString()
    url!: string;
}

export class ExerciseConfig {
    @IsString()
    title!: string;

    @IsString()
    concepts!: string;

    @IsString()
    problem!: string;

    @IsArray()
    @IsString({ each: true })
    expectedOutput!: string[];
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

    @IsString()
    title!: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ReadingMaterialConfig)
    readingMaterial!: ReadingMaterialConfig[];

    // Optional free-text activity for the week. Omit when there is none.
    @IsOptional()
    @IsString()
    activity?: string;

    // Exercise content. Required when `hasExercise` is true; omit otherwise.
    // (When `hasExercise` is false but an exercise is present, it is still
    // validated.)
    @ValidateIf((o: CohortWeekConfig) => o.hasExercise || o.exercise != null)
    @IsDefined()
    @ValidateNested()
    @Type(() => ExerciseConfig)
    exercise?: ExerciseConfig;
}

export class LinkConfig {
    @IsString()
    label!: string;

    @IsString()
    url!: string;

    // Minimum role required to see this link. Absent => visible to everyone.
    @IsOptional()
    @IsEnum(UserRole)
    minRole?: UserRole;
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

    // Course-specific links for this cohort. Use [] if there are none.
    // Global links shared by every cohort (e.g. Wheel of Names, MultiBuzz) are
    // defined once in CohortsConfigService and merged in at load time.
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => LinkConfig)
    links!: LinkConfig[];
}
