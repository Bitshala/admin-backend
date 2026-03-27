import {
    Body,
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
import {
    CertificatePreviewResponseDto,
    GetCertificateResponseDto,
} from '@/certificates/certificates.response.dto';
import { GenerateCertificatesRequestDto } from '@/certificates/certificates.request.dto';

@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@ApiTags('Certificates')
@ApiBearerAuth()
@Controller('certificates')
export class CertificatesController {
    constructor(private readonly certificateService: CertificatesService) {}

    @Get('cohort/:cohortId/preview')
    @ApiOperation({
        summary: 'Preview certificates that would be generated for a cohort',
    })
    @Roles(UserRole.ADMIN, UserRole.TEACHING_ASSISTANT)
    async previewCertificatesForCohort(
        @Param('cohortId', new ParseUUIDPipe()) cohortId: string,
    ): Promise<CertificatePreviewResponseDto[]> {
        return this.certificateService.previewCertificatesForCohort(cohortId);
    }

    @Post('cohort/:cohortId/generate')
    @ApiOperation({
        summary: 'Generate certificates for top performers in a cohort',
    })
    @Roles(UserRole.ADMIN, UserRole.TEACHING_ASSISTANT)
    async generateCertificatesForCohort(
        @Param('cohortId', new ParseUUIDPipe()) cohortId: string,
        @Body() body: GenerateCertificatesRequestDto,
    ): Promise<void> {
        await this.certificateService.generateCertificatesForCohort(
            cohortId,
            body.sendEmail,
        );
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

    @Get('cohort/:cohortId/download')
    @ApiOperation({
        summary: 'Bulk download all certificates for a cohort as a ZIP',
    })
    @Roles(UserRole.ADMIN, UserRole.TEACHING_ASSISTANT)
    async bulkDownloadCohortCertificates(
        @Param('cohortId', new ParseUUIDPipe()) cohortId: string,
        @Res({ passthrough: true }) res: Response,
    ): Promise<StreamableFile> {
        const { fileName, fileStream } =
            await this.certificateService.bulkDownloadCohortCertificates(
                cohortId,
            );
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader(
            'Content-Disposition',
            `attachment; filename="${fileName}"`,
        );
        return fileStream;
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
