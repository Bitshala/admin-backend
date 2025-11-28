import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '@/entities/user.entity';
import { In, Repository } from 'typeorm';
import { UserRole } from '@/common/enum';
import { TeachingAssistantInfoResponseDto } from '@/teaching-assistants/teaching-assistants.response.dto';

@Injectable()
export class TeachingAssistantsService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
    ) {}

    async getTeachingAssistantById(
        id: string,
    ): Promise<TeachingAssistantInfoResponseDto> {
        const teachingAssistant = await this.userRepository.findOne({
            where: { id },
        });

        if (!teachingAssistant) {
            throw new BadRequestException(
                `Teaching assistant not found with id: ${id}`,
            );
        }

        return TeachingAssistantInfoResponseDto.fromUserEntity(
            teachingAssistant,
        );
    }

    async listTeachingAssistants(): Promise<
        TeachingAssistantInfoResponseDto[]
    > {
        const teachingAssistants = await this.userRepository.find({
            where: {
                role: In<UserRole>([
                    UserRole.TEACHING_ASSISTANT,
                    UserRole.ADMIN,
                ]),
            },
        });

        return teachingAssistants.map((u) =>
            TeachingAssistantInfoResponseDto.fromUserEntity(u),
        );
    }
}
