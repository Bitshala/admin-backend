import { Certificate } from '@/entities/certificate.entity';

export class GetCertificateResponseDto {
    id!: string;
    userId!: string;
    cohortId!: string;
    name!: string;
    certificateType!: string;
    createdAt!: string;

    constructor(obj: GetCertificateResponseDto) {
        this.id = obj.id;
        this.userId = obj.userId;
        this.cohortId = obj.cohortId;
        this.name = obj.name;
        this.certificateType = obj.certificateType;
        this.createdAt = obj.createdAt;
    }

    static fromEntity(entity: Certificate): GetCertificateResponseDto {
        return new GetCertificateResponseDto({
            id: entity.id,
            userId: entity.user.id,
            cohortId: entity.cohort.id,
            name: entity.name,
            certificateType: entity.type,
            createdAt: entity.createdAt.toISOString(),
        });
    }

    static fromEntities(entities: Certificate[]): GetCertificateResponseDto[] {
        return entities.map((entity) => this.fromEntity(entity));
    }
}
