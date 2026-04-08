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
    UsePipes,
    ValidationPipe,
} from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiOperation,
    ApiQuery,
    ApiTags,
} from '@nestjs/swagger';
import { FellowshipApplicationsService } from '@/fellowship-applications/fellowship-applications.service';
import {
    CreateFellowshipApplicationRequestDto,
    ReviewFellowshipApplicationRequestDto,
    UpdateFellowshipApplicationRequestDto,
} from '@/fellowship-applications/fellowship-applications.request.dto';
import {
    FellowshipApplicationProposalResponseDto,
    FellowshipApplicationResponseDto,
} from '@/fellowship-applications/fellowship-applications.response.dto';
import { PaginatedDataDto, PaginatedQueryDto } from '@/common/dto';
import { Roles } from '@/auth/roles.decorator';
import {
    UserRole,
    FellowshipApplicationStatus,
    FellowshipType,
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
    @ApiOperation({ summary: 'Submit a draft fellowship application' })
    async submitDraft(
        @Param('id', new ParseUUIDPipe()) id: string,
        @GetUser() user: User,
    ): Promise<FellowshipApplicationResponseDto> {
        return this.service.submitDraft(id, user);
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
    @ApiOperation({ summary: 'Update a draft fellowship application' })
    async updateDraft(
        @Param('id', new ParseUUIDPipe()) id: string,
        @GetUser() user: User,
        @Body() body: UpdateFellowshipApplicationRequestDto,
    ): Promise<FellowshipApplicationResponseDto> {
        return this.service.updateDraft(id, user, body);
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
    async listApplications(
        @Query() query: PaginatedQueryDto,
        @Query('status') status?: FellowshipApplicationStatus,
        @Query('type') type?: FellowshipType,
    ): Promise<PaginatedDataDto<FellowshipApplicationResponseDto>> {
        return this.service.listApplications(query, status, type);
    }

    @Patch(':id/review')
    @ApiOperation({ summary: 'Review a fellowship application (admin)' })
    @Roles(UserRole.ADMIN)
    async reviewApplication(
        @Param('id', new ParseUUIDPipe()) id: string,
        @GetUser() user: User,
        @Body() body: ReviewFellowshipApplicationRequestDto,
    ): Promise<FellowshipApplicationResponseDto> {
        return this.service.reviewApplication(id, user, body);
    }
}
