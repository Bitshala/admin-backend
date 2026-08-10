import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from '@/entities/base.entity';
import { FellowshipReport } from '@/entities/fellowship-report.entity';
import { User } from '@/entities/user.entity';

// Internal, admin-only notes left on a fellowship report while reviewing it — a
// shared thread visible to every admin. Never exposed to the fellow, unlike the
// fellow-facing `reviewerRemarks` on the report.
@Entity()
export class FellowshipReportNote extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column('text')
    body!: string;

    // Deleting a report removes its notes.
    @ManyToOne(() => FellowshipReport, { onDelete: 'CASCADE' })
    report!: FellowshipReport;

    // The admin who wrote the note.
    @ManyToOne(() => User)
    author!: User;
}
