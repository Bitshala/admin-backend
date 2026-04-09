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
import { FellowshipReportsService } from '@/fellowship-reports/fellowship-reports.service';
import {
    CreateFellowshipReportRequestDto,
    ReviewFellowshipReportRequestDto,
    UpdateFellowshipReportRequestDto,
} from '@/fellowship-reports/fellowship-reports.request.dto';
import {
    FellowshipReportContentResponseDto,
    FellowshipReportResponseDto,
} from '@/fellowship-reports/fellowship-reports.response.dto';
import { PaginatedDataDto, PaginatedQueryDto } from '@/common/dto';
import { Roles } from '@/auth/roles.decorator';
import { UserRole, FellowshipReportStatus } from '@/common/enum';
import { GetUser } from '@/decorators/user.decorator';
import { User } from '@/entities/user.entity';

@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@ApiTags('Fellowship Reports')
@ApiBearerAuth()
@Controller('fellowship-reports')
export class FellowshipReportsController {
    constructor(private readonly service: FellowshipReportsService) {}

    @Post()
    @ApiOperation({ summary: 'Create a draft fellowship report' })
    async createReport(
        @GetUser() user: User,
        @Body() body: CreateFellowshipReportRequestDto,
    ): Promise<FellowshipReportResponseDto> {
        return this.service.createReport(user, body);
    }

    @Post(':id/submit')
    @ApiOperation({ summary: 'Submit a draft fellowship report' })
    async submitDraft(
        @Param('id', new ParseUUIDPipe()) id: string,
        @GetUser() user: User,
    ): Promise<FellowshipReportResponseDto> {
        return this.service.submitDraft(id, user);
    }

    @Get('me')
    @ApiOperation({ summary: 'List my fellowship reports' })
    @ApiQuery({ name: 'page', type: 'number', required: false })
    @ApiQuery({ name: 'pageSize', type: 'number', required: false })
    @ApiQuery({ name: 'month', type: 'number', required: false })
    @ApiQuery({ name: 'year', type: 'number', required: false })
    @ApiQuery({
        name: 'status',
        enum: FellowshipReportStatus,
        required: false,
    })
    async getMyReports(
        @GetUser() user: User,
        @Query() query: PaginatedQueryDto,
        @Query('month') month?: number,
        @Query('year') year?: number,
        @Query('status') status?: FellowshipReportStatus,
    ): Promise<PaginatedDataDto<FellowshipReportResponseDto>> {
        return this.service.getMyReports(user, query, month, year, status);
    }

    @Get(':id/content')
    @ApiOperation({ summary: 'Get the content of a fellowship report' })
    async getReportContent(
        @Param('id', new ParseUUIDPipe()) id: string,
        @GetUser() user: User,
    ): Promise<FellowshipReportContentResponseDto> {
        return this.service.getReportContent(id, user);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a fellowship report by ID' })
    async getReport(
        @Param('id', new ParseUUIDPipe()) id: string,
        @GetUser() user: User,
    ): Promise<FellowshipReportResponseDto> {
        return this.service.getReportById(id, user);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update a draft fellowship report' })
    async updateDraft(
        @Param('id', new ParseUUIDPipe()) id: string,
        @GetUser() user: User,
        @Body() body: UpdateFellowshipReportRequestDto,
    ): Promise<FellowshipReportResponseDto> {
        return this.service.updateDraft(id, user, body);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Delete a draft fellowship report' })
    async deleteDraft(
        @Param('id', new ParseUUIDPipe()) id: string,
        @GetUser() user: User,
    ): Promise<void> {
        return this.service.deleteDraft(id, user);
    }

    @Get()
    @ApiOperation({ summary: 'List all fellowship reports (admin)' })
    @Roles(UserRole.ADMIN)
    @ApiQuery({ name: 'page', type: 'number', required: false })
    @ApiQuery({ name: 'pageSize', type: 'number', required: false })
    @ApiQuery({
        name: 'status',
        enum: FellowshipReportStatus,
        required: false,
    })
    @ApiQuery({ name: 'month', type: 'number', required: false })
    @ApiQuery({ name: 'year', type: 'number', required: false })
    async listReports(
        @Query() query: PaginatedQueryDto,
        @Query('status') status?: FellowshipReportStatus,
        @Query('month') month?: number,
        @Query('year') year?: number,
    ): Promise<PaginatedDataDto<FellowshipReportResponseDto>> {
        return this.service.listReports(query, status, month, year);
    }

    @Patch(':id/review')
    @ApiOperation({ summary: 'Review a fellowship report (admin)' })
    @Roles(UserRole.ADMIN)
    async reviewReport(
        @Param('id', new ParseUUIDPipe()) id: string,
        @GetUser() user: User,
        @Body() body: ReviewFellowshipReportRequestDto,
    ): Promise<FellowshipReportResponseDto> {
        return this.service.reviewReport(id, user, body);
    }
}
