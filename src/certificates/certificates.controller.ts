import {
    Controller,
    Get,
    Param,
    ParseUUIDPipe,
    Post,
    Res,
    StreamableFile,
    UsePipes,
    ValidationPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { CertificatesService } from '@/certificates/certificates.service';
import { Roles } from '@/auth/roles.decorator';
import { UserRole } from '@/common/enum';
import { GetUser } from '@/decorators/user.decorator';
import { User } from '@/entities/user.entity';
import { GetCertificateResponseDto } from '@/certificates/certificates.response.dto';

@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@ApiTags('Certificates')
@ApiBearerAuth()
@Controller('certificates')
export class CertificatesController {
    constructor(private readonly certificateService: CertificatesService) {}

    @Post('cohort/:cohortId/generate')
    @ApiOperation({
        summary:
            'Generate certificates for top 10 performers in a cohort (Admin only)',
    })
    @Roles(UserRole.ADMIN, UserRole.TEACHING_ASSISTANT)
    async generateCertificatesForCohort(
        @Param('cohortId', new ParseUUIDPipe()) cohortId: string,
    ): Promise<void> {
        await this.certificateService.generateCertificatesForCohort(cohortId);
    }

    @Get('cohort/:cohortId/me')
    @ApiOperation({ summary: 'Get my certificate for a specific cohort' })
    async getMyCertificate(
        @GetUser() user: User,
        @Param('cohortId', new ParseUUIDPipe()) cohortId: string,
    ): Promise<GetCertificateResponseDto> {
        return this.certificateService.getUserCertificateForCohort(
            user.id,
            cohortId,
        );
    }

    @Get('me')
    @ApiOperation({ summary: 'Get all my certificates' })
    async getMyCertificates(
        @GetUser() user: User,
    ): Promise<GetCertificateResponseDto[]> {
        return this.certificateService.getUserCertificates(user.id);
    }

    @Get('cohort/:cohortId')
    @ApiOperation({ summary: 'Get all certificates for a specific cohort' })
    @Roles(UserRole.ADMIN, UserRole.TEACHING_ASSISTANT)
    async getCohortCertificates(
        @Param('cohortId', new ParseUUIDPipe()) cohortId: string,
    ): Promise<GetCertificateResponseDto[]> {
        return this.certificateService.getCohortCertificates(cohortId);
    }

    @Get(':id/download')
    @ApiOperation({ summary: 'Download a certificate by ID' })
    async downloadCertificate(
        @Param('id', new ParseUUIDPipe()) id: string,
        @Res({ passthrough: true }) res: Response,
    ): Promise<StreamableFile> {
        const { fileName, fileBuffer } =
            await this.certificateService.downloadCertificate(id);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
            'Content-Disposition',
            `attachment; filename="${fileName}"`,
        );
        return fileBuffer;
    }
}
