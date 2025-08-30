import {
    IsBoolean,
    IsDefined,
    IsInt,
    IsNotEmpty,
    IsOptional,
    IsString,
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

class AppConfig {
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
}

export class Config {
    @IsDefined()
    @ValidateNested()
    @Type(() => DbConfig)
    db: DbConfig;

    @IsDefined()
    @ValidateNested()
    @Type(() => AppConfig)
    app: AppConfig;
}
