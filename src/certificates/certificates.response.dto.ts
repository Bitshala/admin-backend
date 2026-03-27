import { Certificate } from '@/entities/certificate.entity';
import { CertificateType, TopPerformerRank } from '@/common/enum';

export class CertificatePreviewResponseDto {
    userId!: string;
    name!: string;
    certificateType!: CertificateType;
    rank!: TopPerformerRank | null;
    withExercises!: boolean;

    constructor(obj: CertificatePreviewResponseDto) {
        this.userId = obj.userId;
        this.name = obj.name;
        this.certificateType = obj.certificateType;
        this.rank = obj.rank;
        this.withExercises = obj.withExercises;
    }

    static fromCertificateEntity(
        entity: Certificate,
    ): CertificatePreviewResponseDto {
        return new CertificatePreviewResponseDto({
            userId: entity.user.id,
            name: entity.name,
            certificateType: entity.type,
            rank: entity.rank,
            withExercises: entity.withExercises,
        });
    }

    static fromCertificateEntities(
        entities: Certificate[],
    ): CertificatePreviewResponseDto[] {
        return entities.map((entity) => this.fromCertificateEntity(entity));
    }
}

export class GetCertificateResponseDto extends CertificatePreviewResponseDto {
    id!: string;
    cohortId!: string;
    createdAt!: string;

    constructor(obj: GetCertificateResponseDto) {
        super(obj);
        this.id = obj.id;
        this.cohortId = obj.cohortId;
        this.createdAt = obj.createdAt;
    }

    static fromEntity(entity: Certificate): GetCertificateResponseDto {
        return new GetCertificateResponseDto({
            id: entity.id,
            userId: entity.user.id,
            cohortId: entity.cohort.id,
            name: entity.name,
            certificateType: entity.type,
            withExercises: entity.withExercises,
            rank: entity.rank,
            createdAt: entity.createdAt.toISOString(),
        });
    }

    static fromEntities(entities: Certificate[]): GetCertificateResponseDto[] {
        return entities.map((entity) => this.fromEntity(entity));
    }
}
