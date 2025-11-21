import { Module } from '@nestjs/common';
import { CertificateModule } from '@/cetificate/certificate.module';
import { CertificatesController } from '@/cetificate/certificates.controller';

@Module({
    imports: [CertificateModule],
    controllers: [CertificatesController],
})
export class CertificatesModule {}
