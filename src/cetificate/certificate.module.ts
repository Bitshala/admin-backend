import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cohort } from '@/entities/cohort.entity';
import { CertificateServiceProvider } from '@/cetificate/certificate.service.provider';
import { AutomatedCertificateService } from '@/cetificate/automated-certificate.service';

@Module({
    imports: [TypeOrmModule.forFeature([Cohort])],
    providers: [CertificateServiceProvider, AutomatedCertificateService],
    exports: [AutomatedCertificateService],
})
export class CertificateModule {}
