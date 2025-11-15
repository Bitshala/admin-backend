import { Module } from '@nestjs/common';
import { MailService } from '@/mail/mail.service';
import { MailCoreService } from '@/mail/mail.core.service';

@Module({
    imports: [],
    controllers: [],
    providers: [MailService, MailCoreService],
    exports: [MailService],
})
export class MailModule {}
