import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    ParseUUIDPipe,
    Patch,
    Post,
    Query,
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
import { MAX_DOCUMENT_BYTES, pdfFileFilter } from '@/common/upload';
import { FellowshipApplicationsService } from '@/fellowship-applications/fellowship-applications.service';
import {
    CreateFellowshipApplicationRequestDto,
    FellowshipApplicationSortBy,
    ListFellowshipApplicationsQueryDto,
    ReviewFellowshipApplicationRequestDto,
    UpdateFellowshipApplicationRequestDto,
} from '@/fellowship-applications/fellowship-applications.request.dto';
import {
    FellowshipApplicationProposalResponseDto,
    FellowshipApplicationResponseDto,
    GithubUserCheckResponseDto,
} from '@/fellowship-applications/fellowship-applications.response.dto';
import { PaginatedDataDto, PaginatedQueryDto } from '@/common/dto';
import { Roles } from '@/auth/roles.decorator';
import {
    UserRole,
    FellowshipApplicationStatus,
    FellowshipType,
    SortOrder,
} from '@/common/enum';
import { GetUser } from '@/decorators/user.decorator';
import { User } from '@/entities/user.entity';

@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@ApiTags('Fellowship Applications')
@ApiBearerAuth()
@Controller('fellowship-applications')
export class FellowshipApplicationsController {
    constructor(private readonly service: FellowshipApplicationsService) {}

    @Post()
    @ApiOperation({ summary: 'Submit a fellowship application' })
    async createApplication(
        @GetUser() user: User,
        @Body() body: CreateFellowshipApplicationRequestDto,
    ): Promise<FellowshipApplicationResponseDto> {
        return this.service.createApplication(user, body);
    }

    @Post(':id/submit')
    @ApiOperation({
        summary:
            'Submit a draft or changes-requested fellowship application for review',
    })
    async submitApplication(
        @Param('id', new ParseUUIDPipe()) id: string,
        @GetUser() user: User,
    ): Promise<FellowshipApplicationResponseDto> {
        return this.service.submitApplication(id, user);
    }

    @Get('me')
    @ApiOperation({ summary: 'List my fellowship applications' })
    @ApiQuery({ name: 'page', type: 'number', required: false })
    @ApiQuery({ name: 'pageSize', type: 'number', required: false })
    async getMyApplications(
        @GetUser() user: User,
        @Query() query: PaginatedQueryDto,
    ): Promise<PaginatedDataDto<FellowshipApplicationResponseDto>> {
        return this.service.getMyApplications(user, query);
    }

    @Get('github/:username')
    @ApiOperation({
        summary:
            'Check whether a GitHub account exists (advisory — exists is null when GitHub is unreachable)',
    })
    async checkGithubUser(
        @Param('username') username: string,
    ): Promise<GithubUserCheckResponseDto> {
        return new GithubUserCheckResponseDto(
            await this.service.checkGithubUser(username),
        );
    }

    @Get(':id/proposal')
    @ApiOperation({ summary: 'Get the proposal for a fellowship application' })
    async getApplicationProposal(
        @Param('id', new ParseUUIDPipe()) id: string,
        @GetUser() user: User,
    ): Promise<FellowshipApplicationProposalResponseDto> {
        return this.service.getApplicationProposal(id, user);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a fellowship application by ID' })
    async getApplication(
        @Param('id', new ParseUUIDPipe()) id: string,
        @GetUser() user: User,
    ): Promise<FellowshipApplicationResponseDto> {
        return this.service.getApplicationById(id, user);
    }

    @Patch(':id')
    @ApiOperation({
        summary: 'Update a draft or changes-requested fellowship application',
    })
    async updateApplication(
        @Param('id', new ParseUUIDPipe()) id: string,
        @GetUser() user: User,
        @Body() body: UpdateFellowshipApplicationRequestDto,
    ): Promise<FellowshipApplicationResponseDto> {
        return this.service.updateApplication(id, user, body);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Delete a draft fellowship application' })
    async deleteDraft(
        @Param('id', new ParseUUIDPipe()) id: string,
        @GetUser() user: User,
    ): Promise<void> {
        return this.service.deleteDraft(id, user);
    }

    @Get()
    @ApiOperation({ summary: 'List all fellowship applications (admin)' })
    @Roles(UserRole.ADMIN)
    @ApiQuery({ name: 'page', type: 'number', required: false })
    @ApiQuery({ name: 'pageSize', type: 'number', required: false })
    @ApiQuery({
        name: 'status',
        enum: FellowshipApplicationStatus,
        required: false,
    })
    @ApiQuery({ name: 'type', enum: FellowshipType, required: false })
    @ApiQuery({ name: 'search', type: 'string', required: false })
    @ApiQuery({
        name: 'sortBy',
        enum: FellowshipApplicationSortBy,
        required: false,
    })
    @ApiQuery({ name: 'sortOrder', enum: SortOrder, required: false })
    async listApplications(
        @Query() query: ListFellowshipApplicationsQueryDto,
    ): Promise<PaginatedDataDto<FellowshipApplicationResponseDto>> {
        return this.service.listApplications(query);
    }

    @Patch(':id/review')
    @ApiOperation({
        summary:
            'Review a fellowship application (admin). Accepting is multipart and carries the Bitshala-signed unsigned-contract PDF as `file`.',
    })
    @ApiConsumes('multipart/form-data', 'application/json')
    @Roles(UserRole.ADMIN)
    @UseInterceptors(
        FileInterceptor('file', {
            limits: { fileSize: MAX_DOCUMENT_BYTES },
            fileFilter: pdfFileFilter,
        }),
    )
    async reviewApplication(
        @Param('id', new ParseUUIDPipe()) id: string,
        @GetUser() user: User,
        @Body() body: ReviewFellowshipApplicationRequestDto,
        @UploadedFile() file?: Express.Multer.File,
    ): Promise<FellowshipApplicationResponseDto> {
        return this.service.reviewApplication(id, user, body, file);
    }
}
