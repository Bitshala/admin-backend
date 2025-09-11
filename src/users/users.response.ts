// dto/get-user.response.ts
import { User } from '@/entities/user.entity';

export class GetUserResponse {
    id: string;
    email: string;
    discordUsername: string;
    discordGlobalName: string | null;
    name: string | null;
    role: string;
    description: string | null;
    background: string | null;
    githubProfileUrl: string | null;
    skills: string[] | null;
    // ISO date (YYYY-MM-DD) of when first heard about Bitcoin
    firstHeardAboutBitcoinOn: string | null;
    bitcoinBooksRead: string[] | null;
    whyBitcoin: string | null;
    weeklyCohortCommitmentHours: number | null;
    location: string | null;

    constructor(partial: Partial<GetUserResponse>) {
        Object.assign(this, partial);
    }

    static fromEntity(user: User): GetUserResponse {
        return new GetUserResponse({
            id: user.id,
            email: user.email,
            discordUsername: user.discordUserName,
            discordGlobalName: user.discordGlobalName,
            name: user.name,
            role: user.role,
            description: user.description,
            background: user.background,
            githubProfileUrl: user.githubProfileUrl,
            skills: user.skills,
            firstHeardAboutBitcoinOn:
                user.firstHeardAboutBitcoinOn?.toISOString().slice(0, 10) ??
                null,
            bitcoinBooksRead: user.bitcoinBooksRead,
            whyBitcoin: user.whyBitcoin,
            weeklyCohortCommitmentHours: user.weeklyCohortCommitmentHours,
            location: user.location,
        });
    }
}
