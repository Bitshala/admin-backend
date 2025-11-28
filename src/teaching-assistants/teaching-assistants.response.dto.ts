import { User } from '@/entities/user.entity';

export class TeachingAssistantInfoResponseDto {
    id: string;
    email: string | null;
    discordUserId: string;
    discordUserName: string;
    discordGlobalName: string | null;
    name: string | null;

    constructor(partial: Partial<TeachingAssistantInfoResponseDto>) {
        Object.assign(this, partial);
    }

    static fromUserEntity(user: User): TeachingAssistantInfoResponseDto {
        return new TeachingAssistantInfoResponseDto({
            id: user.id,
            email: user.email,
            discordUserId: user.discordUserId,
            discordUserName: user.discordUserName,
            discordGlobalName: user.discordGlobalName,
            name: user.name,
        });
    }
}
