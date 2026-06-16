import {
    IsEnum,
    IsNotEmpty,
    IsString,
    MaxLength,
    ValidateIf,
} from 'class-validator';
import { Transform } from 'class-transformer';

export enum FellowshipDocumentReviewAction {
    APPROVE = 'APPROVE',
    REJECT = 'REJECT',
}

export class ReviewFellowshipDocumentDto {
    @IsEnum(FellowshipDocumentReviewAction)
    action!: FellowshipDocumentReviewAction;

    // Required when rejecting; surfaced to the fellow in the rejection email.
    @ValidateIf(
        (o: ReviewFellowshipDocumentDto) =>
            o.action === FellowshipDocumentReviewAction.REJECT,
    )
    @Transform(({ value }) =>
        typeof value === 'string' ? value.trim() : value,
    )
    @IsString()
    @IsNotEmpty()
    @MaxLength(2000)
    rejectionReason?: string;
}
