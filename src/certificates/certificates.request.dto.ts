import { IsBoolean } from 'class-validator';

export class GenerateCertificatesRequestDto {
    @IsBoolean()
    sendEmail!: boolean;
}
