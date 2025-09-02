export class GetUserResponse {
    id: string;
    email: string;
    discordUsername: string;
    discordGlobalName: string | null;
    name: string | null;
    role: string;
    description: string | null;

    constructor(partial: GetUserResponse) {
        Object.assign(this, partial);
    }
}
