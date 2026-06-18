import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

// Generous upper bound for an internal note. Only the bound is enforced here;
// the body is otherwise free-form text.
export const NOTE_BODY_MAX_LENGTH = 5000;

const trim = ({ value }: { value: unknown }): unknown =>
    typeof value === 'string' ? value.trim() : value;

export class CreateFellowshipApplicationNoteRequestDto {
    @Transform(trim)
    @IsString()
    @IsNotEmpty()
    @MaxLength(NOTE_BODY_MAX_LENGTH)
    body!: string;
}

// Editing a note replaces its body; same shape and rules as creating one.
export class UpdateFellowshipApplicationNoteRequestDto extends CreateFellowshipApplicationNoteRequestDto {}
