import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cohort } from '@/entities/cohort.entity';
import { CertificatesGenerationService } from '@/certificates/certificates-generation.service';
import { CertificatesService } from '@/certificates/certificates.service';
import { CertificatesController } from '@/certificates/certificates.controller';
import { Certificate } from '@/entities/certificate.entity';
import { CertificatesCacheService } from '@/certificates/certificates.cache.service';
import { ScoresModule } from '@/scores/scores.module';
import { MailModule } from '@/mail/mail.module';
import { DbTransactionModule } from '@/db-transaction/db-transaction.module';
import { User } from '@/entities/user.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([Certificate, Cohort, User]),
        ScoresModule,
        MailModule,
        DbTransactionModule,
    ],
    providers: [
        CertificatesCacheService,
        CertificatesGenerationService,
        CertificatesService,
    ],
    controllers: [CertificatesController],
    exports: [CertificatesService],
})
export class CertificatesModule {}
