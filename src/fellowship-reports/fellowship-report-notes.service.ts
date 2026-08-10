import {
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FellowshipReport } from '@/entities/fellowship-report.entity';
import { FellowshipReportNote } from '@/entities/fellowship-report-note.entity';
import { User } from '@/entities/user.entity';
import {
    CreateFellowshipReportNoteRequestDto,
    UpdateFellowshipReportNoteRequestDto,
} from '@/fellowship-reports/fellowship-report-notes.request.dto';
import { FellowshipReportNoteResponseDto } from '@/fellowship-reports/fellowship-report-notes.response.dto';

@Injectable()
export class FellowshipReportNotesService {
    constructor(
        @InjectRepository(FellowshipReportNote)
        private readonly noteRepository: Repository<FellowshipReportNote>,
        @InjectRepository(FellowshipReport)
        private readonly reportRepository: Repository<FellowshipReport>,
    ) {}

    async createNote(
        reportId: string,
        author: User,
        dto: CreateFellowshipReportNoteRequestDto,
    ): Promise<FellowshipReportNoteResponseDto> {
        const report = await this.getReportOrThrow(reportId);

        const note = this.noteRepository.create({
            body: dto.body,
            report,
            author,
        });
        const { id } = await this.noteRepository.save(note);

        // Reload so timestamps and the author relation are populated from the DB.
        return FellowshipReportNoteResponseDto.fromEntity(
            await this.getNoteOrThrow(reportId, id),
        );
    }

    async listNotes(
        reportId: string,
    ): Promise<FellowshipReportNoteResponseDto[]> {
        await this.getReportOrThrow(reportId);

        const notes = await this.noteRepository.find({
            where: { report: { id: reportId } },
            relations: { report: true, author: true },
            order: { createdAt: 'ASC' },
        });

        return notes.map(FellowshipReportNoteResponseDto.fromEntity);
    }

    async updateNote(
        reportId: string,
        noteId: string,
        user: User,
        dto: UpdateFellowshipReportNoteRequestDto,
    ): Promise<FellowshipReportNoteResponseDto> {
        const note = await this.getNoteOrThrow(reportId, noteId);
        this.assertAuthor(note, user);

        note.body = dto.body;
        await this.noteRepository.save(note);

        return FellowshipReportNoteResponseDto.fromEntity(note);
    }

    async deleteNote(
        reportId: string,
        noteId: string,
        user: User,
    ): Promise<void> {
        const note = await this.getNoteOrThrow(reportId, noteId);
        this.assertAuthor(note, user);

        await this.noteRepository.remove(note);
    }

    private async getReportOrThrow(
        reportId: string,
    ): Promise<FellowshipReport> {
        const report = await this.reportRepository.findOne({
            where: { id: reportId },
            select: { id: true },
        });
        if (!report) {
            throw new NotFoundException('Report not found');
        }
        return report;
    }

    // Scoped to the report so a note cannot be reached through the wrong report
    // path. Loads the author for the ownership check and response.
    private async getNoteOrThrow(
        reportId: string,
        noteId: string,
    ): Promise<FellowshipReportNote> {
        const note = await this.noteRepository.findOne({
            where: { id: noteId, report: { id: reportId } },
            relations: { report: true, author: true },
        });
        if (!note) {
            throw new NotFoundException('Note not found');
        }
        return note;
    }

    // Admins may edit or delete only the notes they authored.
    private assertAuthor(note: FellowshipReportNote, user: User): void {
        if (note.author.id !== user.id) {
            throw new ForbiddenException('You can only modify your own notes');
        }
    }
}
