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
import { FellowshipReportNotesService } from '@/fellowship-reports/fellowship-report-notes.service';
import {
    CreateFellowshipReportNoteRequestDto,
    UpdateFellowshipReportNoteRequestDto,
} from '@/fellowship-reports/fellowship-report-notes.request.dto';
import { FellowshipReportNoteResponseDto } from '@/fellowship-reports/fellowship-report-notes.response.dto';

// Internal admin notes live as a sub-resource of a report. Every route is
// admin-only (see the per-route @Roles); reads are shared across admins, while
// writes are restricted to the note's author in the service.
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@ApiTags('Fellowship Report Notes')
@ApiBearerAuth()
@Controller('fellowship-reports/:reportId/notes')
export class FellowshipReportNotesController {
    constructor(private readonly service: FellowshipReportNotesService) {}

    @Post()
    @ApiOperation({
        summary: 'Add an internal note to a fellowship report (admin)',
    })
    @Roles(UserRole.ADMIN)
    async createNote(
        @Param('reportId', new ParseUUIDPipe()) reportId: string,
        @GetUser() user: User,
        @Body() body: CreateFellowshipReportNoteRequestDto,
    ): Promise<FellowshipReportNoteResponseDto> {
        return this.service.createNote(reportId, user, body);
    }

    @Get()
    @ApiOperation({
        summary: 'List internal notes on a fellowship report (admin)',
    })
    @Roles(UserRole.ADMIN)
    async listNotes(
        @Param('reportId', new ParseUUIDPipe()) reportId: string,
    ): Promise<FellowshipReportNoteResponseDto[]> {
        return this.service.listNotes(reportId);
    }

    @Patch(':noteId')
    @ApiOperation({ summary: 'Edit one of your own internal notes (admin)' })
    @Roles(UserRole.ADMIN)
    async updateNote(
        @Param('reportId', new ParseUUIDPipe()) reportId: string,
        @Param('noteId', new ParseUUIDPipe()) noteId: string,
        @GetUser() user: User,
        @Body() body: UpdateFellowshipReportNoteRequestDto,
    ): Promise<FellowshipReportNoteResponseDto> {
        return this.service.updateNote(reportId, noteId, user, body);
    }

    @Delete(':noteId')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Delete one of your own internal notes (admin)' })
    @Roles(UserRole.ADMIN)
    async deleteNote(
        @Param('reportId', new ParseUUIDPipe()) reportId: string,
        @Param('noteId', new ParseUUIDPipe()) noteId: string,
        @GetUser() user: User,
    ): Promise<void> {
        return this.service.deleteNote(reportId, noteId, user);
    }
}
