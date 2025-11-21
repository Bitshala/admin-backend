import {
    Controller,
    Get,
    Param,
    ParseUUIDPipe,
    Post,
    Res,
    UsePipes,
    ValidationPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { AutomatedCertificateService } from '@/cetificate/automated-certificate.service';
import { Roles } from '@/auth/roles.decorator';
import { UserRole } from '@/common/enum';
import { GetUser } from '@/decorators/user.decorator';
import { User } from '@/entities/user.entity';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { CertificateType } from '@/cetificate/enums/certificate.enum';
import {
    CERTIFICATE_PATHS,
    generateCertificateFileName,
    generateCertificateDownloadPath,
} from '@/cetificate/constants/certificate.constants';

@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@ApiTags('Certificates')
@ApiBearerAuth()
@Controller('certificates')
export class CertificatesController {
    constructor(
        private readonly automatedCertificateService: AutomatedCertificateService,
    ) {}

    @Post('cohort/:cohortId/generate')
    @ApiOperation({
        summary:
            'Generate certificates for top 10 performers in a cohort (Admin only)',
    })
    @Roles(UserRole.ADMIN)
    async generateCertificatesForCohort(
        @Param('cohortId', new ParseUUIDPipe()) cohortId: string,
    ) {
        const certificates =
            await this.automatedCertificateService.generateCertificatesForCohort(
                cohortId,
            );
        return {
            message: `Generated ${certificates.length} certificates`,
            certificates: certificates.map((cert) => ({
                userId: cert.userId,
                userName: cert.userName,
                certificateType: cert.certificateType,
                downloadUrl: cert.downloadPath,
            })),
        };
    }

    @Post('cohort/:cohortId/user/:userId/generate')
    @ApiOperation({
        summary: 'Generate certificate for a specific user in a cohort',
    })
    @Roles(UserRole.ADMIN, UserRole.TEACHING_ASSISTANT)
    async generateCertificateForUser(
        @Param('cohortId', new ParseUUIDPipe()) cohortId: string,
        @Param('userId', new ParseUUIDPipe()) userId: string,
    ) {
        const certificate =
            await this.automatedCertificateService.generateCertificateForUser(
                userId,
                cohortId,
            );
        return {
            message: 'Certificate generated successfully',
            certificate: {
                userId: certificate.userId,
                userName: certificate.userName,
                certificateType: certificate.certificateType,
                downloadUrl: certificate.downloadPath,
            },
        };
    }

    @Get(':cohortId/:fileName')
    @ApiOperation({ summary: 'Download a certificate PDF' })
    async downloadCertificate(
        @Param('cohortId', new ParseUUIDPipe()) cohortId: string,
        @Param('fileName') fileName: string,
        @Res() res: Response,
        @GetUser() user: User,
    ) {
        // Check if user is admin or downloading their own certificate
        const isAdmin = user.role === UserRole.ADMIN;
        const isTA = user.role === UserRole.TEACHING_ASSISTANT;
        const isOwnCertificate = fileName.startsWith(user.id);

        if (!isAdmin && !isTA && !isOwnCertificate) {
            return res.status(403).json({
                message: 'You can only download your own certificate',
            });
        }

        const filePath = join(
            process.cwd(),
            CERTIFICATE_PATHS.outputPath,
            cohortId,
            fileName,
        );

        if (!existsSync(filePath)) {
            return res.status(404).json({
                message: 'Certificate not found',
            });
        }

        const fileBuffer = readFileSync(filePath);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
            'Content-Disposition',
            `attachment; filename="${fileName}"`,
        );
        res.send(fileBuffer);
    }

    @Get('me/cohort/:cohortId')
    @ApiOperation({ summary: 'Get my certificate for a specific cohort' })
    async getMyCertificate(
        @GetUser() user: User,
        @Param('cohortId', new ParseUUIDPipe()) cohortId: string,
    ) {
        const outputDir = join(
            process.cwd(),
            CERTIFICATE_PATHS.outputPath,
            cohortId,
        );

        if (!existsSync(outputDir)) {
            return {
                message: 'No certificates generated for this cohort yet',
                certificate: null,
            };
        }

        // Check for participant and performer certificates
        const participantFile = generateCertificateFileName(
            user.id,
            CertificateType.PARTICIPANT,
        );
        const performerFile = generateCertificateFileName(
            user.id,
            CertificateType.PERFORMER,
        );

        const participantPath = join(outputDir, participantFile);
        const performerPath = join(outputDir, performerFile);

        if (existsSync(performerPath)) {
            return {
                message: 'Certificate found',
                certificate: {
                    certificateType: CertificateType.PERFORMER,
                    downloadUrl: generateCertificateDownloadPath(
                        cohortId,
                        performerFile,
                    ),
                },
            };
        }

        if (existsSync(participantPath)) {
            return {
                message: 'Certificate found',
                certificate: {
                    certificateType: CertificateType.PARTICIPANT,
                    downloadUrl: generateCertificateDownloadPath(
                        cohortId,
                        participantFile,
                    ),
                },
            };
        }

        return {
            message: 'No certificate found for you in this cohort',
            certificate: null,
        };
    }
}
