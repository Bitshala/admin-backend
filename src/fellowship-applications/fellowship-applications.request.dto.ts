import {
    IsEnum,
    IsNotEmpty,
    IsOptional,
    IsString,
    IsUrl,
    Matches,
} from 'class-validator';
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

    // Required when status === ACCEPTED (enforced in the service).
    // Folder hosts the unsigned contract and is where the fellow uploads
    // their W-8BEN form.
    @IsOptional()
    @IsUrl()
    @Matches(/^https:\/\/drive\.google\.com\//, {
        message: 'driveFolderUrl must be a Google Drive URL',
    })
    driveFolderUrl?: string;
}
