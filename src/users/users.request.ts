import { UserRole } from '@/common/enum';
import {
    IsEnum,
    IsNotEmpty,
    IsOptional,
    IsString,
    IsUUID,
} from 'class-validator';

export class UpdateUserRequest {
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    name?: string;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    description?: string;
}

export class UpdateUserRoleRequest {
    @IsUUID()
    userId: string;

    @IsEnum(UserRole)
    role: UserRole;
}
