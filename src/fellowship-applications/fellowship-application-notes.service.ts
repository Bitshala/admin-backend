import {
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FellowshipApplication } from '@/entities/fellowship-application.entity';
import { FellowshipApplicationNote } from '@/entities/fellowship-application-note.entity';
import { User } from '@/entities/user.entity';
import {
    CreateFellowshipApplicationNoteRequestDto,
    UpdateFellowshipApplicationNoteRequestDto,
} from '@/fellowship-applications/fellowship-application-notes.request.dto';
import { FellowshipApplicationNoteResponseDto } from '@/fellowship-applications/fellowship-application-notes.response.dto';

@Injectable()
export class FellowshipApplicationNotesService {
    constructor(
        @InjectRepository(FellowshipApplicationNote)
        private readonly noteRepository: Repository<FellowshipApplicationNote>,
        @InjectRepository(FellowshipApplication)
        private readonly applicationRepository: Repository<FellowshipApplication>,
    ) {}

    async createNote(
        applicationId: string,
        author: User,
        dto: CreateFellowshipApplicationNoteRequestDto,
    ): Promise<FellowshipApplicationNoteResponseDto> {
        const application = await this.getApplicationOrThrow(applicationId);

        const note = this.noteRepository.create({
            body: dto.body,
            application,
            author,
        });
        const { id } = await this.noteRepository.save(note);

        // Reload so timestamps and the author relation are populated from the DB.
        return FellowshipApplicationNoteResponseDto.fromEntity(
            await this.getNoteOrThrow(applicationId, id),
        );
    }

    async listNotes(
        applicationId: string,
    ): Promise<FellowshipApplicationNoteResponseDto[]> {
        await this.getApplicationOrThrow(applicationId);

        const notes = await this.noteRepository.find({
            where: { application: { id: applicationId } },
            relations: { application: true, author: true },
            order: { createdAt: 'ASC' },
        });

        return notes.map(FellowshipApplicationNoteResponseDto.fromEntity);
    }

    async updateNote(
        applicationId: string,
        noteId: string,
        user: User,
        dto: UpdateFellowshipApplicationNoteRequestDto,
    ): Promise<FellowshipApplicationNoteResponseDto> {
        const note = await this.getNoteOrThrow(applicationId, noteId);
        this.assertAuthor(note, user);

        note.body = dto.body;
        await this.noteRepository.save(note);

        return FellowshipApplicationNoteResponseDto.fromEntity(note);
    }

    async deleteNote(
        applicationId: string,
        noteId: string,
        user: User,
    ): Promise<void> {
        const note = await this.getNoteOrThrow(applicationId, noteId);
        this.assertAuthor(note, user);

        await this.noteRepository.remove(note);
    }

    private async getApplicationOrThrow(
        applicationId: string,
    ): Promise<FellowshipApplication> {
        const application = await this.applicationRepository.findOne({
            where: { id: applicationId },
            select: { id: true },
        });
        if (!application) {
            throw new NotFoundException('Application not found');
        }
        return application;
    }

    // Scoped to the application so a note cannot be reached through the wrong
    // application path. Loads the author for the ownership check and response.
    private async getNoteOrThrow(
        applicationId: string,
        noteId: string,
    ): Promise<FellowshipApplicationNote> {
        const note = await this.noteRepository.findOne({
            where: { id: noteId, application: { id: applicationId } },
            relations: { application: true, author: true },
        });
        if (!note) {
            throw new NotFoundException('Note not found');
        }
        return note;
    }

    // Admins may edit or delete only the notes they authored.
    private assertAuthor(note: FellowshipApplicationNote, user: User): void {
        if (note.author.id !== user.id) {
            throw new ForbiddenException('You can only modify your own notes');
        }
    }
}
