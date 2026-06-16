import {
    Body,
    Controller,
    Get,
    Param,
    ParseUUIDPipe,
    Patch,
    Post,
    Query,
    Res,
    StreamableFile,
    UploadedFile,
    UseInterceptors,
    UsePipes,
    ValidationPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
    ApiBearerAuth,
    ApiConsumes,
    ApiOperation,
    ApiQuery,
    ApiTags,
} from '@nestjs/swagger';
import { Response } from 'express';
import { FellowshipsService } from '@/fellowships/fellowships.service';
import {
    FellowshipSortBy,
    ListFellowshipsQueryDto,
    StartFellowshipContractDto,
} from '@/fellowships/fellowships.request.dto';
import { FellowshipResponseDto } from '@/fellowships/fellowships.response.dto';
import { PaginatedDataDto, PaginatedQueryDto } from '@/common/dto';
import { Roles } from '@/auth/roles.decorator';
import {
    FellowshipStatus,
    FellowshipType,
    SortOrder,
    UserRole,
} from '@/common/enum';
import { GetUser } from '@/decorators/user.decorator';
import { User } from '@/entities/user.entity';
import { FellowshipDocumentsService } from '@/fellowship-documents/fellowship-documents.service';
import { FellowshipDocumentResponseDto } from '@/fellowship-documents/fellowship-documents.response.dto';
import { ReviewFellowshipDocumentDto } from '@/fellowship-documents/fellowship-documents.request.dto';
import { MAX_DOCUMENT_BYTES, pdfFileFilter } from '@/common/upload';

@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@ApiTags('Fellowships')
@ApiBearerAuth()
@Controller('fellowships')
export class FellowshipsController {
    constructor(
        private readonly service: FellowshipsService,
        private readonly documentsService: FellowshipDocumentsService,
    ) {}

    @Patch(':id/start-contract')
    @ApiOperation({ summary: 'Start fellowship contract (admin)' })
    @Roles(UserRole.ADMIN)
    async startContract(
        @Param('id', new ParseUUIDPipe()) id: string,
        @Body() body: StartFellowshipContractDto,
    ): Promise<FellowshipResponseDto> {
        return this.service.startContract(id, body);
    }

    @Get(':id/documents')
    @ApiOperation({ summary: 'List a fellowship’s documents (fellow/admin)' })
    async listDocuments(
        @Param('id', new ParseUUIDPipe()) id: string,
        @GetUser() user: User,
    ): Promise<FellowshipDocumentResponseDto[]> {
        return this.documentsService.listDocuments(id, user);
    }

    @Get(':id/documents/:documentId/download')
    @ApiOperation({
        summary: 'Download a fellowship document by ID (fellow/admin)',
    })
    async downloadDocument(
        @Param('id', new ParseUUIDPipe()) id: string,
        @Param('documentId', new ParseUUIDPipe()) documentId: string,
        @GetUser() user: User,
        @Res({ passthrough: true }) res: Response,
    ): Promise<StreamableFile> {
        const { stream, fileName, mimeType } =
            await this.documentsService.downloadDocument(id, documentId, user);
        res.setHeader('Content-Type', mimeType);
        res.setHeader(
            'Content-Disposition',
            `attachment; filename="${fileName}"`,
        );
        // Never let a fellow-uploaded PDF render inline under our origin.
        res.setHeader('X-Content-Type-Options', 'nosniff');
        return new StreamableFile(stream);
    }

    @Post(':id/documents/:documentId')
    @ApiOperation({
        summary:
            'Upload (or re-upload) a fellowship document by ID as `file` (fellow)',
    })
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(
        FileInterceptor('file', {
            limits: { fileSize: MAX_DOCUMENT_BYTES },
            fileFilter: pdfFileFilter,
        }),
    )
    async uploadDocument(
        @Param('id', new ParseUUIDPipe()) id: string,
        @Param('documentId', new ParseUUIDPipe()) documentId: string,
        @GetUser() user: User,
        @UploadedFile() file: Express.Multer.File,
    ): Promise<FellowshipDocumentResponseDto> {
        return this.documentsService.uploadDocument(id, documentId, user, file);
    }

    @Patch(':id/documents/:documentId/review')
    @ApiOperation({
        summary: 'Approve or reject a fellowship document (admin)',
    })
    @Roles(UserRole.ADMIN)
    async reviewDocument(
        @Param('id', new ParseUUIDPipe()) id: string,
        @Param('documentId', new ParseUUIDPipe()) documentId: string,
        @GetUser() user: User,
        @Body() body: ReviewFellowshipDocumentDto,
    ): Promise<FellowshipDocumentResponseDto> {
        return this.documentsService.reviewDocument(id, documentId, user, body);
    }

    @Get('me')
    @ApiOperation({ summary: 'List my fellowships' })
    @ApiQuery({ name: 'page', type: 'number', required: false })
    @ApiQuery({ name: 'pageSize', type: 'number', required: false })
    async getMyFellowships(
        @GetUser() user: User,
        @Query() query: PaginatedQueryDto,
    ): Promise<PaginatedDataDto<FellowshipResponseDto>> {
        return this.service.getMyFellowships(user, query);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a fellowship by ID' })
    async getFellowship(
        @Param('id', new ParseUUIDPipe()) id: string,
        @GetUser() user: User,
    ): Promise<FellowshipResponseDto> {
        return this.service.getFellowshipById(id, user);
    }

    @Get()
    @ApiOperation({ summary: 'List all fellowships (admin)' })
    @Roles(UserRole.ADMIN)
    @ApiQuery({ name: 'page', type: 'number', required: false })
    @ApiQuery({ name: 'pageSize', type: 'number', required: false })
    @ApiQuery({ name: 'status', enum: FellowshipStatus, required: false })
    @ApiQuery({ name: 'type', enum: FellowshipType, required: false })
    @ApiQuery({ name: 'search', type: 'string', required: false })
    @ApiQuery({ name: 'sortBy', enum: FellowshipSortBy, required: false })
    @ApiQuery({ name: 'sortOrder', enum: SortOrder, required: false })
    async listFellowships(
        @Query() query: ListFellowshipsQueryDto,
    ): Promise<PaginatedDataDto<FellowshipResponseDto>> {
        return this.service.listFellowships(query);
    }
}
