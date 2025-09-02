import { Body, Controller, Get, Patch } from '@nestjs/common';
import { UsersService } from '@/users/users.service';
import { GetUser } from '@/decorators/user.decorator';
import { User } from '@/entities/user.entity';
import {
    UpdateUserRequest,
    UpdateUserRoleRequest,
} from '@/users/users.request';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '@/auth/roles.decorator';
import { UserRole } from '@/common/enum';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    @Get('me')
    @ApiOperation({ summary: 'Get current user profile' })
    getMe(@GetUser() user: User) {
        return this.usersService.getMe(user);
    }

    @Patch('me')
    @ApiOperation({ summary: 'Update current user profile' })
    async updateMe(@GetUser() user: User, @Body() body: UpdateUserRequest) {
        return this.usersService.updateMe(user, body);
    }

    @Patch('role')
    @ApiOperation({ summary: 'Update user role (admin only)' })
    @Roles(UserRole.ADMIN)
    async updateUserRole(@Body() body: UpdateUserRoleRequest) {
        return this.usersService.updateUserRole(body);
    }
}
