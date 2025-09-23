import {
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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ScoresService } from '@/scores/scores.service';
import {
    GetUsersScoresResponseDto,
    ListScoresForCohortAndWeekResponseDto,
} from '@/scores/scores.response.dto';
import { Roles } from '@/auth/roles.decorator';
import { UserRole } from '@/common/enum';
import { UpdateScoresRequestDto } from '@/scores/scores.request.dto';
import { GetUser } from '@/decorators/user.decorator';
import { User } from '@/entities/user.entity';

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

    @Post('week/:weekId/assign-groups')
    @ApiOperation({
        summary: 'Assign users to groups based on scores and attendance',
    })
    @Roles(UserRole.TEACHING_ASSISTANT, UserRole.ADMIN)
    async assignGroupsForCohortWeek(
        @Param('weekId', new ParseUUIDPipe()) weekId: string,
    ): Promise<void> {
        return this.scoresService.assignGroupsForCohortWeek(weekId);
    }
}
