import {
    IsBoolean,
    IsDefined,
    IsInt,
    IsNotEmpty,
    IsNumberString,
    IsOptional,
    IsString,
    IsUrl,
    Max,
    Min,
    ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ArrayContains } from 'class-validator';

class PostgresConfig {
    @IsString()
    @IsNotEmpty()
    host: string;

    @IsInt()
    port: number;

    @IsString()
    @IsNotEmpty()
    username: string;

    @IsString()
    @IsNotEmpty()
    password: string;

    @IsString()
    @IsNotEmpty()
    databaseName: string;
}

class DbConfig {
    @IsDefined()
    @ValidateNested()
    postgres: PostgresConfig;

    @IsBoolean()
    synchronize: boolean;
}

class RedisConfig {
    @IsUrl({
        require_protocol: true,
        protocols: ['redis', 'rediss'],
        require_tld: false,
    })
    url: string;
}

class CacheConfig {
    @IsDefined()
    @ValidateNested()
    @Type(() => RedisConfig)
    redis: RedisConfig;
}

class DiscordRolesConfig {
    @IsNumberString({ no_symbols: true })
    admin: string;

    @IsNumberString({ no_symbols: true })
    teachingAssistant: string;

    @IsNumberString({ no_symbols: true })
    masteringBitcoin: string;

    @IsNumberString({ no_symbols: true })
    learningBitcoinFromCommandLine: string;

    @IsNumberString({ no_symbols: true })
    programmingBitcoin: string;

    @IsNumberString({ no_symbols: true })
    bitcoinProtocolDevelopment: string;
}

class DiscordConfig {
    @IsString()
    @IsNotEmpty()
    clientId: string;

    @IsString()
    @IsNotEmpty()
    clientSecret: string;

    @IsString()
    @IsNotEmpty()
    botToken: string;

    @IsInt()
    @Min(60)
    stateTtlSeconds: number;

    @IsUrl({
        require_protocol: true,
        protocols: ['https'],
    })
    apiBaseUrl: string;

    @IsUrl({
        require_protocol: true,
        protocols: ['https'],
    })
    oauthUrl: string;

    @IsNumberString({ no_symbols: true })
    guildId: string;

    @IsString({ each: true })
    @IsNotEmpty({ each: true })
    @ArrayContains([
        'identify',
        'email',
        'guilds',
        'guilds.join',
        'guilds.members.read',
    ])
    authScopes: string[];

    @IsDefined()
    @ValidateNested()
    @Type(() => DiscordRolesConfig)
    roles: DiscordRolesConfig;
}

class AppAuthConfig {
    @IsString()
    @IsNotEmpty()
    callbackPath: string;

    @IsString()
    @IsNotEmpty()
    dashboardRedirectPath: string;

    @IsInt()
    @Min(300)
    sessionTtlSeconds: number;
}

class AppConfig {
    @IsUrl({ require_tld: false })
    baseUrl: string;

    @IsInt()
    @Min(1)
    @Max(65535)
    port: number;

    @IsOptional()
    @IsBoolean()
    verbose?: boolean;

    @IsOptional()
    @IsBoolean()
    debug?: boolean;

    @IsDefined()
    @ValidateNested()
    @Type(() => AppAuthConfig)
    auth: AppAuthConfig;
}

export class Config {
    @IsDefined()
    @ValidateNested()
    @Type(() => DbConfig)
    db: DbConfig;

    @IsDefined()
    @ValidateNested()
    @Type(() => CacheConfig)
    cache: CacheConfig;

    @IsDefined()
    @ValidateNested()
    @Type(() => DiscordConfig)
    discord: DiscordConfig;

    @IsDefined()
    @ValidateNested()
    @Type(() => AppConfig)
    app: AppConfig;
}
