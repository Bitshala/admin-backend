import {
    Controller,
    Get,
    Param,
    ParseUUIDPipe,
    UsePipes,
    ValidationPipe,
} from '@nestjs/common';
import { TeachingAssistantsService } from '@/teaching-assistants/teaching-assistants.service';
import { TeachingAssistantInfoResponseDto } from '@/teaching-assistants/teaching-assistants.response.dto';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '@/auth/roles.decorator';
import { UserRole } from '@/common/enum';

@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@ApiTags('Teaching Assistants')
@ApiBearerAuth()
@Controller('teaching-assistants')
export class TeachingAssistantsController {
    constructor(
        private readonly teachingAssistantsService: TeachingAssistantsService,
    ) {}

    @Get()
    @ApiOperation({
        summary: 'List all teaching assistants',
    })
    @Roles(UserRole.TEACHING_ASSISTANT, UserRole.ADMIN)
    async listTeachingAssistants(): Promise<
        TeachingAssistantInfoResponseDto[]
    > {
        return this.teachingAssistantsService.listTeachingAssistants();
    }

    @Get(':id')
    @ApiOperation({
        summary: 'Get teaching assistant by ID',
    })
    @Roles(UserRole.TEACHING_ASSISTANT, UserRole.ADMIN)
    async getTeachingAssistantById(
        @Param('id', new ParseUUIDPipe()) id: string,
    ): Promise<TeachingAssistantInfoResponseDto> {
        return this.teachingAssistantsService.getTeachingAssistantById(id);
    }
}
