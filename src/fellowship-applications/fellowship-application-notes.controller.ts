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
    UsePipes,
    ValidationPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '@/auth/roles.decorator';
import { UserRole } from '@/common/enum';
import { GetUser } from '@/decorators/user.decorator';
import { User } from '@/entities/user.entity';
import { FellowshipApplicationNotesService } from '@/fellowship-applications/fellowship-application-notes.service';
import {
    CreateFellowshipApplicationNoteRequestDto,
    UpdateFellowshipApplicationNoteRequestDto,
} from '@/fellowship-applications/fellowship-application-notes.request.dto';
import { FellowshipApplicationNoteResponseDto } from '@/fellowship-applications/fellowship-application-notes.response.dto';

// Internal admin notes live as a sub-resource of an application. Every route is
// admin-only (see the per-route @Roles); reads are shared across admins, while
// writes are restricted to the note's author in the service.
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@ApiTags('Fellowship Application Notes')
@ApiBearerAuth()
@Controller('fellowship-applications/:applicationId/notes')
export class FellowshipApplicationNotesController {
    constructor(private readonly service: FellowshipApplicationNotesService) {}

    @Post()
    @ApiOperation({
        summary: 'Add an internal note to a fellowship application (admin)',
    })
    @Roles(UserRole.ADMIN)
    async createNote(
        @Param('applicationId', new ParseUUIDPipe()) applicationId: string,
        @GetUser() user: User,
        @Body() body: CreateFellowshipApplicationNoteRequestDto,
    ): Promise<FellowshipApplicationNoteResponseDto> {
        return this.service.createNote(applicationId, user, body);
    }

    @Get()
    @ApiOperation({
        summary: 'List internal notes on a fellowship application (admin)',
    })
    @Roles(UserRole.ADMIN)
    async listNotes(
        @Param('applicationId', new ParseUUIDPipe()) applicationId: string,
    ): Promise<FellowshipApplicationNoteResponseDto[]> {
        return this.service.listNotes(applicationId);
    }

    @Patch(':noteId')
    @ApiOperation({ summary: 'Edit one of your own internal notes (admin)' })
    @Roles(UserRole.ADMIN)
    async updateNote(
        @Param('applicationId', new ParseUUIDPipe()) applicationId: string,
        @Param('noteId', new ParseUUIDPipe()) noteId: string,
        @GetUser() user: User,
        @Body() body: UpdateFellowshipApplicationNoteRequestDto,
    ): Promise<FellowshipApplicationNoteResponseDto> {
        return this.service.updateNote(applicationId, noteId, user, body);
    }

    @Delete(':noteId')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Delete one of your own internal notes (admin)' })
    @Roles(UserRole.ADMIN)
    async deleteNote(
        @Param('applicationId', new ParseUUIDPipe()) applicationId: string,
        @Param('noteId', new ParseUUIDPipe()) noteId: string,
        @GetUser() user: User,
    ): Promise<void> {
        return this.service.deleteNote(applicationId, noteId, user);
    }
}
