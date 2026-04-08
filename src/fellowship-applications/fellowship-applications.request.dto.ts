import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { FellowshipType, FellowshipApplicationStatus } from '@/common/enum';

export class CreateFellowshipApplicationRequestDto {
    @IsEnum(FellowshipType)
    type!: FellowshipType;

    @IsString()
    @IsNotEmpty()
    proposal!: string;
}

export class UpdateFellowshipApplicationRequestDto {
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    proposal?: string;
}

export class ReviewFellowshipApplicationRequestDto {
    @IsEnum(FellowshipApplicationStatus)
    status!: FellowshipApplicationStatus;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    reviewerRemarks?: string;
}
