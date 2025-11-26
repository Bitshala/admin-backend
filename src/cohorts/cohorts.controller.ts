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
    JoinWaitlistRequestDto,
    UpdateCohortRequestDto,
    UpdateCohortWeekRequestDto,
} from '@/cohorts/cohorts.request.dto';
import {
    GetCohortResponseDto,
    UserCohortWaitlistResponseDto,
} from '@/cohorts/cohorts.response.dto';
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

    @Get('me')
    @ApiOperation({ summary: 'List my cohorts with pagination' })
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
    async listMyCohorts(
        @GetUser() user: User,
        @Query() query: PaginatedQueryDto,
    ): Promise<PaginatedDataDto<GetCohortResponseDto>> {
        return this.cohortsService.listMyCohorts(user, query);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a cohort by ID' })
    async getCohort(
        @Param('id', new ParseUUIDPipe()) id: string,
    ): Promise<GetCohortResponseDto> {
        return this.cohortsService.getCohort(id);
    }

    @Post()
    @ApiOperation({ summary: 'Create a new cohort' })
    @Roles(UserRole.TEACHING_ASSISTANT, UserRole.ADMIN)
    async createCohort(@Body() body: CreateCohortRequestDto): Promise<void> {
        await this.cohortsService.createCohort(body);
    }

    @Patch(':cohortId')
    @ApiOperation({ summary: 'Update a cohort' })
    @Roles(UserRole.TEACHING_ASSISTANT, UserRole.ADMIN)
    async updateCohort(
        @Param('cohortId', new ParseUUIDPipe())
        cohortId: string,
        @Body() body: UpdateCohortRequestDto,
    ): Promise<void> {
        await this.cohortsService.updateCohort(cohortId, body);
    }

    @Patch('weeks/:cohortWeekId')
    @ApiOperation({ summary: 'Update a cohort week' })
    @Roles(UserRole.TEACHING_ASSISTANT, UserRole.ADMIN)
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

    @Post(':cohortId/add/:userId')
    @ApiOperation({ summary: 'Add a user to a cohort' })
    @Roles(UserRole.TEACHING_ASSISTANT, UserRole.ADMIN)
    async addUserToCohort(
        @Param('userId', new ParseUUIDPipe()) userId: string,
        @Param('cohortId', new ParseUUIDPipe()) cohortId: string,
    ): Promise<void> {
        await this.cohortsService.addUserToCohort(userId, cohortId);
    }

    @Post(':cohortId/remove/:userId')
    @ApiOperation({ summary: 'Remove a user from a cohort' })
    @Roles(UserRole.TEACHING_ASSISTANT, UserRole.ADMIN)
    async removeUserFromCohort(
        @Param('userId', new ParseUUIDPipe()) userId: string,
        @Param('cohortId', new ParseUUIDPipe()) cohortId: string,
    ): Promise<void> {
        await this.cohortsService.removeUserFromCohort(userId, cohortId);
    }

    @Post('waitlist')
    @ApiOperation({ summary: 'Join the cohort waitlist' })
    async joinCohortWaitlist(
        @GetUser() user: User,
        @Body() body: JoinWaitlistRequestDto,
    ): Promise<void> {
        await this.cohortsService.joinCohortWaitlist(user, body);
    }

    @Get('waitlist/me')
    @ApiOperation({ summary: 'Get user waitlist status' })
    async getUserWaitlistStatus(
        @GetUser() user: User,
    ): Promise<UserCohortWaitlistResponseDto> {
        return this.cohortsService.getUserWaitlist(user);
    }
}
