import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from '@/entities/base.entity';
import { FellowshipApplication } from '@/entities/fellowship-application.entity';
import { User } from '@/entities/user.entity';

// Internal, admin-only notes left on a fellowship application while reviewing
// the proposal — a shared thread visible to every admin. Never exposed to the
// applicant, unlike the applicant-facing `reviewerRemarks` on the application.
@Entity()
export class FellowshipApplicationNote extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column('text')
    body!: string;

    // Deleting an application removes its notes.
    @ManyToOne(() => FellowshipApplication, { onDelete: 'CASCADE' })
    application!: FellowshipApplication;

    // The admin who wrote the note.
    @ManyToOne(() => User)
    author!: User;
}
