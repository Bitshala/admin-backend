import {
    Column,
    Entity,
    ManyToOne,
    PrimaryGeneratedColumn,
    Unique,
} from 'typeorm';
import { BaseEntity } from '@/entities/base.entity';
import {
    FellowshipDocumentStatus,
    FellowshipDocumentType,
} from '@/common/enum';
import { FellowshipApplication } from '@/entities/fellowship-application.entity';
import { User } from '@/entities/user.entity';

// One current row per (application, type). A re-upload replaces the content as a
// new Drive revision and resets the row to PENDING_REVIEW rather than inserting
// a new row.
@Entity()
@Unique(['application', 'type'])
export class FellowshipDocument extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @ManyToOne(() => FellowshipApplication, { onDelete: 'CASCADE' })
    application!: FellowshipApplication;

    @Column({ type: 'enum', enum: FellowshipDocumentType })
    type!: FellowshipDocumentType;

    @Column({ type: 'enum', enum: FellowshipDocumentStatus })
    status!: FellowshipDocumentStatus;

    // Null until first upload; never leaves the server.
    @Column('text', { nullable: true })
    driveFileId!: string | null;

    @Column('text', { nullable: true })
    fileName!: string | null;

    @Column('text', { nullable: true })
    mimeType!: string | null;

    @Column('int', { nullable: true })
    sizeBytes!: number | null;

    @Column('text', { nullable: true })
    rejectionReason!: string | null;

    @ManyToOne(() => User, { nullable: true })
    uploadedBy!: User | null;

    @ManyToOne(() => User, { nullable: true })
    reviewedBy!: User | null;
}
