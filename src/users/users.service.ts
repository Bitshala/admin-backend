import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '@/entities/user.entity';
import { Repository } from 'typeorm';
import { UserRole } from '@/common/enum';
import { randomUUID } from 'crypto';
import { GetUserResponse } from '@/users/users.response';
import {
    UpdateUserRequest,
    UpdateUserRoleRequest,
} from '@/users/users.request';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UsersService {
    private readonly adminRoleId: string;
    private readonly teachingAssistantRoleId: string;

    constructor(
        @InjectRepository(User) private userRepository: Repository<User>,
        private readonly configService: ConfigService,
    ) {
        this.adminRoleId = this.configService.getOrThrow<string>(
            'discord.roles.admin',
        );
        this.teachingAssistantRoleId = this.configService.getOrThrow<string>(
            'discord.roles.teachingAssistant',
        );
    }

    async findByUserId(userId: string): Promise<User> {
        const user = await this.userRepository.findOne({
            where: { id: userId },
        });
        if (!user) {
            throw new BadRequestException('User not found');
        }

        return user;
    }

    async createStudentUser(data: {
        email: string | null;
        discordUserId: string;
        discordUsername: string;
        discordGlobalName: string;
        isGuildMember: boolean;
        roles: string[];
    }): Promise<User> {
        const userAlreadyExists = await this.userRepository.exists({
            where: { discordUserId: data.discordUserId },
        });

        if (userAlreadyExists) {
            throw new BadRequestException(
                'User with this email already exists',
            );
        }

        if (!data.email) {
            throw new BadRequestException('Email is required to create a user');
        }

        const user = new User();
        user.id = randomUUID();
        user.email = data.email;
        user.discordUserId = data.discordUserId;
        user.discordUserName = data.discordUsername;
        user.discordGlobalName = data.discordGlobalName;
        user.isGuildMember = data.isGuildMember;
        user.role = this.inferUserRoleFromDiscordRoles(data.roles);

        return this.userRepository.save(user);
    }

    inferUserRoleFromDiscordRoles(roles: string[]): UserRole {
        if (roles.includes(this.adminRoleId)) return UserRole.ADMIN;
        if (roles.includes(this.teachingAssistantRoleId))
            return UserRole.TEACHING_ASSISTANT;
        return UserRole.STUDENT;
    }

    async upsertUser(data: {
        email: string | null;
        discordUserId: string;
        discordUsername: string;
        discordGlobalName: string;
        isGuildMember: boolean;
        roles: string[];
    }): Promise<User> {
        const user = await this.userRepository.findOne({
            where: { discordUserId: data.discordUserId },
        });

        if (!data.email) {
            throw new BadRequestException('Email is required to create a user');
        }

        if (user) {
            user.discordUserName = data.discordUsername;
            user.discordGlobalName = data.discordGlobalName;
            user.email = data.email;
            user.isGuildMember = data.isGuildMember;
            user.role = this.inferUserRoleFromDiscordRoles(data.roles);
            return this.userRepository.save(user);
        } else {
            return this.createStudentUser(data);
        }
    }

    getMe(user: User): GetUserResponse {
        return GetUserResponse.fromEntity(user);
    }

    async updateMe(
        user: User,
        body: UpdateUserRequest,
    ): Promise<GetUserResponse> {
        if (body.name !== undefined) {
            user.name = body.name;
        }
        if (body.description !== undefined) {
            user.description = body.description;
        }

        await this.userRepository.save(user);
        return GetUserResponse.fromEntity(user);
    }

    async updateUserRole(body: UpdateUserRoleRequest): Promise<void> {
        await this.userRepository.update(body.userId, { role: body.role });
    }
}
