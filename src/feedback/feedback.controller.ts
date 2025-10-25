import {
    Body,
    Controller,
    Get,
    Param,
    ParseUUIDPipe,
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
import { FeedbackService } from '@/feedback/feedback.service';
import { CreateFeedbackRequestDto } from '@/feedback/feedback.request.dto';
import {
    CreateFeedbackResponseDto,
    GetFeedbackResponseDto,
} from '@/feedback/feedback.response.dto';
import { GetUser } from '@/decorators/user.decorator';
import { User } from '@/entities/user.entity';
import { PaginatedDataDto, PaginatedQueryDto } from '@/common/dto';
import { Roles } from '@/auth/roles.decorator';
import { UserRole } from '@/common/enum';

@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@ApiTags('Feedback')
@ApiBearerAuth()
@Controller('feedback')
export class FeedbackController {
    constructor(private readonly feedbackService: FeedbackService) {}

    @Post()
    @ApiOperation({ summary: 'Submit feedback for a cohort' })
    async createFeedback(
        @GetUser() user: User,
        @Body() body: CreateFeedbackRequestDto,
    ): Promise<CreateFeedbackResponseDto> {
        return this.feedbackService.createFeedback(user, body);
    }

    @Get('me')
    @ApiOperation({ summary: 'Get my submitted feedback' })
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
    async listMyFeedback(
        @GetUser() user: User,
        @Query() query: PaginatedQueryDto,
    ): Promise<PaginatedDataDto<GetFeedbackResponseDto>> {
        return this.feedbackService.listMyFeedback(user, query);
    }

    @Get()
    @ApiOperation({ summary: 'List all feedback (Admin/TA only)' })
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
    @Roles(UserRole.ADMIN, UserRole.TEACHING_ASSISTANT)
    async listFeedback(
        @Query() query: PaginatedQueryDto,
    ): Promise<PaginatedDataDto<GetFeedbackResponseDto>> {
        return this.feedbackService.listFeedback(query);
    }

    @Get('cohort/:cohortId')
    @ApiOperation({ summary: 'List feedback by cohort (Admin/TA only)' })
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
    @Roles(UserRole.ADMIN, UserRole.TEACHING_ASSISTANT)
    async listFeedbackByCohort(
        @Param('cohortId', new ParseUUIDPipe()) cohortId: string,
        @Query() query: PaginatedQueryDto,
    ): Promise<PaginatedDataDto<GetFeedbackResponseDto>> {
        return this.feedbackService.listFeedbackByCohort(cohortId, query);
    }

    @Get(':id')
    @ApiOperation({
        summary: 'Get specific feedback by feedback ID (Admin/TA only)',
    })
    @Roles(UserRole.ADMIN, UserRole.TEACHING_ASSISTANT)
    async getFeedbackById(
        @Param('id', new ParseUUIDPipe()) id: string,
    ): Promise<GetFeedbackResponseDto> {
        return this.feedbackService.getFeedbackById(id);
    }
}
