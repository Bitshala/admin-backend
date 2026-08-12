import {
    Body,
    Controller,
    Get,
    Param,
    Patch,
    Query,
    UsePipes,
    ValidationPipe,
} from '@nestjs/common';
import { UsersService } from '@/users/users.service';
import { GetUser } from '@/decorators/user.decorator';
import { User } from '@/entities/user.entity';
import {
    ListUsersQueryDto,
    UpdateUserRequest,
    UpdateUserRoleRequest,
    UserSortBy,
} from '@/users/users.request';
import {
    ApiBearerAuth,
    ApiOperation,
    ApiQuery,
    ApiTags,
} from '@nestjs/swagger';
import { Roles } from '@/auth/roles.decorator';
import { SortOrder, UserRole } from '@/common/enum';

@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    @Get()
    @ApiOperation({ summary: 'Search users (admin)' })
    @Roles(UserRole.ADMIN)
    @ApiQuery({ name: 'page', type: 'number', required: false })
    @ApiQuery({ name: 'pageSize', type: 'number', required: false })
    @ApiQuery({ name: 'search', type: 'string', required: false })
    @ApiQuery({ name: 'sortBy', enum: UserSortBy, required: false })
    @ApiQuery({ name: 'sortOrder', enum: SortOrder, required: false })
    searchUsers(@Query() query: ListUsersQueryDto) {
        return this.usersService.searchUsers(query);
    }

    @Get('me')
    @ApiOperation({ summary: 'Get current user profile' })
    getMe(@GetUser() user: User) {
        return this.usersService.getMe(user);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get user profile by ID' })
    @Roles(UserRole.ADMIN, UserRole.TEACHING_ASSISTANT)
    getUserById(@Param('id') id: string) {
        return this.usersService.getUserById(id);
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
