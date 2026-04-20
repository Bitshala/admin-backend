import {
    Body,
    Controller,
    Get,
    Param,
    ParseUUIDPipe,
    Patch,
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
import { FellowshipsService } from '@/fellowships/fellowships.service';
import {
    CompleteFellowshipOnboardingDto,
    StartFellowshipContractDto,
} from '@/fellowships/fellowships.request.dto';
import { FellowshipResponseDto } from '@/fellowships/fellowships.response.dto';
import { PaginatedDataDto, PaginatedQueryDto } from '@/common/dto';
import { Roles } from '@/auth/roles.decorator';
import { UserRole } from '@/common/enum';
import { GetUser } from '@/decorators/user.decorator';
import { User } from '@/entities/user.entity';

@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@ApiTags('Fellowships')
@ApiBearerAuth()
@Controller('fellowships')
export class FellowshipsController {
    constructor(private readonly service: FellowshipsService) {}

    @Patch(':id/start-contract')
    @ApiOperation({ summary: 'Start fellowship contract (admin)' })
    @Roles(UserRole.ADMIN)
    async startContract(
        @Param('id', new ParseUUIDPipe()) id: string,
        @Body() body: StartFellowshipContractDto,
    ): Promise<FellowshipResponseDto> {
        return this.service.startContract(id, body);
    }

    @Patch(':id/onboarding')
    @ApiOperation({
        summary: 'Complete fellowship onboarding with additional details',
    })
    async completeOnboarding(
        @Param('id', new ParseUUIDPipe()) id: string,
        @GetUser() user: User,
        @Body() body: CompleteFellowshipOnboardingDto,
    ): Promise<FellowshipResponseDto> {
        return this.service.completeOnboarding(user, id, body);
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
    async listFellowships(
        @Query() query: PaginatedQueryDto,
    ): Promise<PaginatedDataDto<FellowshipResponseDto>> {
        return this.service.listFellowships(query);
    }
}
