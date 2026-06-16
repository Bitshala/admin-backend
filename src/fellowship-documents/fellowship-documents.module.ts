import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FellowshipDocument } from '@/entities/fellowship-document.entity';
import { Fellowship } from '@/entities/fellowship.entity';
import { FellowshipDocumentsService } from '@/fellowship-documents/fellowship-documents.service';
import { GoogleDriveClientModule } from '@/google-drive/client/google-drive-client.module';
import { DbTransactionModule } from '@/db-transaction/db-transaction.module';
import { MailModule } from '@/mail/mail.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([FellowshipDocument, Fellowship]),
        GoogleDriveClientModule,
        DbTransactionModule,
        MailModule,
    ],
    providers: [FellowshipDocumentsService],
    exports: [FellowshipDocumentsService],
})
export class FellowshipDocumentsModule {}
