import {
    applyDecorators,
    Body,
    Controller,
    Get,
    Param,
    ParseUUIDPipe,
    Patch,
    Post,
    UsePipes,
    ValidationPipe,
} from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiExtraModels,
    ApiOkResponse,
    ApiOperation,
    ApiTags,
    getSchemaPath,
} from '@nestjs/swagger';
import { ScoresService } from '@/scores/scores.service';
import {
    CrossCohortPerformanceEntryDto,
    GetUsersScoresResponseDto,
    LeaderboardEntryDto,
    ListScoresForCohortAndWeekResponseDto,
    PublicLeaderboardEntryDto,
    StudentLeaderboardEntryDto,
} from '@/scores/scores.response.dto';
import { Roles } from '@/auth/roles.decorator';
import { Public } from '@/auth/public-route.decorator';
import { isAtLeastRole } from '@/cohorts/cohort-access.util';
import { UserRole } from '@/common/enum';
import {
    AssignGroupsRequestDto,
    AssignTAToGroupRequestDto,
    UpdateScoresRequestDto,
} from '@/scores/scores.request.dto';
import { GetUser } from '@/decorators/user.decorator';
import { User } from '@/entities/user.entity';

function ApiCrossCohortPerformanceResponse() {
    return applyDecorators(
        ApiExtraModels(CrossCohortPerformanceEntryDto),
        ApiOkResponse({
            description:
                'Map of "<cohortType>_S<season>" to { scoreReceived, maxScore, attendedWeeks, totalWeeks }',
            schema: {
                type: 'object',
                additionalProperties: {
                    $ref: getSchemaPath(CrossCohortPerformanceEntryDto),
                },
            },
        }),
    );
}

// The leaderboard row shape depends on the caller's role, so the response is
// documented as a union rather than a single model.
function ApiLeaderboardResponse() {
    return applyDecorators(
        ApiExtraModels(LeaderboardEntryDto, StudentLeaderboardEntryDto),
        ApiOkResponse({
            description:
                'LeaderboardEntryDto[] for TA/Admin, StudentLeaderboardEntryDto[] for students',
            schema: {
                type: 'array',
                items: {
                    oneOf: [
                        { $ref: getSchemaPath(LeaderboardEntryDto) },
                        { $ref: getSchemaPath(StudentLeaderboardEntryDto) },
                    ],
                },
            },
        }),
    );
}

@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@ApiTags('Scores')
@ApiBearerAuth()
@Controller('scores')
export class ScoresController {
    constructor(private readonly scoresService: ScoresService) {}

    @Get('cohort/:cohortId/week/:weekId')
    @ApiOperation({
        summary: 'List scores for all users in a cohort for a specific week',
    })
    @Roles(UserRole.TEACHING_ASSISTANT, UserRole.ADMIN)
    async listScoresForCohortAndWeek(
        @Param('cohortId', new ParseUUIDPipe()) cohortId: string,
        @Param('weekId', new ParseUUIDPipe()) weekId: string,
    ): Promise<ListScoresForCohortAndWeekResponseDto> {
        return this.scoresService.listScoresForCohortAndWeek(cohortId, weekId);
    }

    @Get('cohort/:cohortId/leaderboard')
    @ApiOperation({
        summary:
            'Get aggregated scores for a cohort across all weeks for leaderboard',
        description:
            'Every row carries the full score and attendance breakdown. Staff additionally see member identity (real name, Discord global name); students see the Discord handle only.',
    })
    @ApiLeaderboardResponse()
    @Roles(UserRole.STUDENT, UserRole.TEACHING_ASSISTANT, UserRole.ADMIN)
    async getCohortLeaderboard(
        @Param('cohortId', new ParseUUIDPipe()) cohortId: string,
        @GetUser() user: User,
    ): Promise<LeaderboardEntryDto[] | StudentLeaderboardEntryDto[]> {
        // Members' real names are staff-only. Students get the same scores and
        // attendance figures over a Discord-handle-only identity, so the
        // leaderboard UI keeps working without leaking who anyone is.
        return isAtLeastRole(user.role, UserRole.TEACHING_ASSISTANT)
            ? this.scoresService.getCohortLeaderboard(cohortId)
            : this.scoresService.getStudentCohortLeaderboard(cohortId);
    }

    @Public()
    @Get('cohort/:cohortId/leaderboard/public')
    @ApiOperation({ summary: 'Public cohort leaderboard (no PII)' })
    async getPublicCohortLeaderboard(
        @Param('cohortId', new ParseUUIDPipe()) cohortId: string,
    ): Promise<PublicLeaderboardEntryDto[]> {
        return this.scoresService.getPublicCohortLeaderboard(cohortId);
    }

    @Patch('user/:userId/cohort/:cohortId/week/:weekId')
    @ApiOperation({
        summary: 'Update group discussion and exercise scores for a user',
    })
    @Roles(UserRole.TEACHING_ASSISTANT, UserRole.ADMIN)
    async updateScoresForUserCohortAndWeek(
        @Param('userId', new ParseUUIDPipe()) userId: string,
        @Param('cohortId', new ParseUUIDPipe()) cohortId: string,
        @Param('weekId', new ParseUUIDPipe()) weekId: string,
        @Body() body: UpdateScoresRequestDto,
    ): Promise<void> {
        return this.scoresService.updateScoresForUserCohortAndWeek(
            userId,
            cohortId,
            weekId,
            body,
        );
    }

    @Get('me')
    @ApiOperation({
        summary: 'Get scores for the authenticated user',
    })
    @Roles(UserRole.STUDENT, UserRole.TEACHING_ASSISTANT, UserRole.ADMIN)
    async getMyScores(
        @GetUser() user: User,
    ): Promise<GetUsersScoresResponseDto> {
        return this.scoresService.getUserScores(user.id);
    }

    @Get('user/:userId')
    @ApiOperation({
        summary: 'Get scores for the authenticated user',
    })
    @Roles(UserRole.TEACHING_ASSISTANT, UserRole.ADMIN)
    async getUserScores(
        @Param('userId', new ParseUUIDPipe()) userId: string,
    ): Promise<GetUsersScoresResponseDto> {
        return this.scoresService.getUserScores(userId);
    }

    @Get('me/cross-cohort-performance')
    @ApiOperation({
        summary:
            "Get the authenticated user's score received vs total score per cohort",
    })
    @ApiCrossCohortPerformanceResponse()
    @Roles(UserRole.STUDENT, UserRole.TEACHING_ASSISTANT, UserRole.ADMIN)
    async getMyCrossCohortPerformance(
        @GetUser() user: User,
    ): Promise<Record<string, CrossCohortPerformanceEntryDto>> {
        return this.scoresService.getCrossCohortPerformance(user.id);
    }

    @Get('user/:userId/cross-cohort-performance')
    @ApiOperation({
        summary: "Get a user's score received vs total score per cohort",
    })
    @ApiCrossCohortPerformanceResponse()
    @Roles(UserRole.TEACHING_ASSISTANT, UserRole.ADMIN)
    async getUserCrossCohortPerformance(
        @Param('userId', new ParseUUIDPipe()) userId: string,
    ): Promise<Record<string, CrossCohortPerformanceEntryDto>> {
        return this.scoresService.getCrossCohortPerformance(userId);
    }

    @Post('week/:weekId/assign-groups')
    @ApiOperation({
        summary: 'Assign users to groups based on scores and attendance',
    })
    @Roles(UserRole.TEACHING_ASSISTANT, UserRole.ADMIN)
    async assignGroupsForCohortWeek(
        @Param('weekId', new ParseUUIDPipe()) weekId: string,
        @Body() body: AssignGroupsRequestDto,
    ): Promise<void> {
        return this.scoresService.assignGroupsForCohortWeek(weekId, body);
    }

    @Post('week/:weekId/assign-ta-to-group')
    @ApiOperation({
        summary: 'Assign a TA to a group for a specific week',
    })
    @Roles(UserRole.TEACHING_ASSISTANT, UserRole.ADMIN)
    async assignTAToGroup(
        @Param('weekId', ParseUUIDPipe) weekId: string,
        @Body() body: AssignTAToGroupRequestDto,
    ): Promise<void> {
        return this.scoresService.assignTAToGroup(
            weekId,
            body.userId,
            body.groupNumber,
        );
    }
}
