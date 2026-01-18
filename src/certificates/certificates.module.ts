import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cohort } from '@/entities/cohort.entity';
import { CertificatesGenerationService } from '@/certificates/certificates-generation.service';
import { CertificatesService } from '@/certificates/certificates.service';
import { CertificatesController } from '@/certificates/certificates.controller';
import { Certificate } from '@/entities/certificate.entity';
import { CertificatesCacheService } from '@/certificates/certificates.cache.service';
import { ScoresModule } from '@/scores/scores.module';

@Module({
    imports: [TypeOrmModule.forFeature([Certificate, Cohort]), ScoresModule],
    providers: [
        CertificatesCacheService,
        CertificatesGenerationService,
        CertificatesService,
    ],
    controllers: [CertificatesController],
    exports: [CertificatesService],
})
export class CertificatesModule {}
