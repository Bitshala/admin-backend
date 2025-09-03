import {
    Body,
    Controller,
    Get,
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
import {
    CreateCohortRequestDto,
    UpdateCohortRequestDto,
    UpdateCohortWeekRequestDto,
} from '@/cohorts/cohorts.request.dto';
import { GetCohortResponseDto } from '@/cohorts/cohorts.response.dto';
import { PaginatedDataDto, PaginatedQueryDto } from '@/common/dto';
import { CohortsService } from '@/cohorts/cohorts.service';
import { Roles } from '@/auth/roles.decorator';
import { UserRole } from '@/common/enum';
import { GetUser } from '@/decorators/user.decorator';
import { User } from '@/entities/user.entity';

@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@ApiTags('Cohorts')
@ApiBearerAuth()
@Controller('cohorts')
export class CohortsController {
    constructor(private readonly cohortsService: CohortsService) {}

    @Get(':id')
    @ApiOperation({ summary: 'Get a cohort by ID' })
    async getCohort(
        @Param('id', new ParseUUIDPipe()) id: string,
    ): Promise<GetCohortResponseDto> {
        return this.cohortsService.getCohort(id);
    }

    @Get()
    @ApiOperation({ summary: 'List cohorts with pagination' })
    @ApiQuery({
        name: 'page',
        type: 'number',
        required: false,
        description: 'Page number for pagination',
    })
    @ApiQuery({
        name: 'pageSize',
        type: 'number',
        required: false,
        description: 'Number of items per page',
    })
    async listCohorts(
        @Query() query: PaginatedQueryDto,
    ): Promise<PaginatedDataDto<GetCohortResponseDto>> {
        return this.cohortsService.listCohorts(query);
    }

    @Post()
    @ApiOperation({ summary: 'Create a new cohort' })
    @Roles(UserRole.ADMIN)
    async createCohort(@Body() body: CreateCohortRequestDto): Promise<void> {
        await this.cohortsService.createCohort(body);
    }

    @Patch(':cohortId')
    @ApiOperation({ summary: 'Update a cohort' })
    @Roles(UserRole.ADMIN)
    async updateCohort(
        @Param('cohortId', new ParseUUIDPipe())
        cohortId: string,
        @Body() body: UpdateCohortRequestDto,
    ): Promise<void> {
        await this.cohortsService.updateCohort(cohortId, body);
    }

    @Patch('weeks/:cohortWeekId')
    @ApiOperation({ summary: 'Update a cohort week' })
    @Roles(UserRole.ADMIN)
    async updateCohortWeek(
        @Param('cohortWeekId', new ParseUUIDPipe())
        cohortWeekId: string,
        @Body() body: UpdateCohortWeekRequestDto,
    ): Promise<void> {
        await this.cohortsService.updateCohortWeek(cohortWeekId, body);
    }

    @Post(':cohortId/join')
    @ApiOperation({ summary: 'Join a cohort' })
    async joinCohort(
        @Param('cohortId', new ParseUUIDPipe()) cohortId: string,
        @GetUser() user: User,
    ): Promise<void> {
        await this.cohortsService.joinCohort(user, cohortId);
    }
}
