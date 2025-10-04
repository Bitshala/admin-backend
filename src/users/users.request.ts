import {
    IsArray,
    IsDateString,
    IsInt,
    IsNotEmpty,
    IsOptional,
    IsString,
    IsUrl,
    MaxLength,
    Min,
    Max,
    IsUUID,
    IsEnum,
    IsEmail,
} from 'class-validator';
import { UserRole } from '@/common/enum';

export class UpdateUserRequest {
    @IsOptional()
    @IsEmail()
    email?: string;

    /** Full name or pseudonym */
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    name?: string;

    /** Describe yourself */
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    @MaxLength(10000)
    description?: string;

    /** High-level background (career, education, etc.) */
    @IsOptional()
    @IsString()
    @MaxLength(10000)
    background?: string;

    /** GitHub profile URL */
    @IsOptional()
    @IsUrl({ require_protocol: true })
    @MaxLength(2048)
    githubProfileUrl?: string;

    /** Skills */
    @IsOptional()
    @IsArray()
    @IsNotEmpty({ each: true })
    @IsString({ each: true })
    skills?: string[];

    /** When first heard about Bitcoin (ISO date, e.g., 2015-06-01) */
    @IsOptional()
    @IsDateString()
    firstHeardAboutBitcoinOn?: string;

    /** Bitcoin books read */
    @IsOptional()
    @IsArray()
    @IsNotEmpty({ each: true })
    @IsString({ each: true })
    bitcoinBooksRead?: string[];

    /** Motivation */
    @IsOptional()
    @IsString()
    @MaxLength(10000)
    whyBitcoin?: string;

    /** Hours per week (0–168) */
    @IsOptional()
    @IsInt()
    @Min(0)
    @Max(168)
    weeklyCohortCommitmentHours?: number;

    /** Free-form location (e.g., "Bengaluru, IN") */
    @IsOptional()
    @IsString()
    @MaxLength(255)
    location?: string;
}

export class UpdateUserRoleRequest {
    @IsUUID()
    userId: string;

    @IsEnum(UserRole)
    role: UserRole;
}
