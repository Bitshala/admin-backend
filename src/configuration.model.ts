import {
    IsBoolean,
    IsDefined,
    IsInt,
    IsNotEmpty,
    IsOptional,
    IsString,
    IsUrl,
    Max,
    Min,
    ValidateIf,
    ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class PostgresConfig {
    @IsString()
    @IsNotEmpty()
    host: string;

    @IsInt()
    port: number;

    @IsString()
    @IsNotEmpty()
    username: string;

    @IsBoolean()
    useIamAuth: boolean;

    @ValidateIf((o) => o.useIamAuth == false)
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

class DiscordConfig {
    @IsString()
    @IsNotEmpty()
    clientId: string;

    @IsString()
    @IsNotEmpty()
    clientSecret: string;

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

    @IsString({ each: true })
    @IsNotEmpty({ each: true })
    authScopes: string[];
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
    @Type(() => DiscordConfig)
    discord: DiscordConfig;

    @IsDefined()
    @ValidateNested()
    @Type(() => AppConfig)
    app: AppConfig;
}
