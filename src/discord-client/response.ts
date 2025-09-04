export interface DiscordTokenResponse {
    access_token: string;
    token_type: 'Bearer';
    expires_in: number;
    refresh_token: string;
    scope: string;
}

export interface DiscordUser {
    id: string;
    username: string;
    email?: string;
    global_name?: string;
}

export interface GuildPartial {
    id: string;
    name: string;
}

export interface GuildMember {
    user?: DiscordUser;
    nick?: string;
    roles: string[];
    joined_at?: string;
}
