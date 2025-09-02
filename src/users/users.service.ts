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

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User) private userRepository: Repository<User>,
    ) {}

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
        user.role = UserRole.STUDENT;

        return this.userRepository.save(user);
    }

    async upsertUser(data: {
        email: string | null;
        discordUserId: string;
        discordUsername: string;
        discordGlobalName: string;
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
            return this.userRepository.save(user);
        } else {
            return this.createStudentUser(data);
        }
    }

    getMe(user: User): GetUserResponse {
        return new GetUserResponse({
            id: user.id,
            email: user.email,
            discordUsername: user.discordUserName,
            discordGlobalName: user.discordGlobalName,
            name: user.name,
            role: user.role,
            description: user.description,
        });
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

        const updatedUser = await this.userRepository.save(user);
        return new GetUserResponse({
            id: updatedUser.id,
            email: updatedUser.email,
            discordUsername: updatedUser.discordUserName,
            discordGlobalName: updatedUser.discordGlobalName,
            name: updatedUser.name,
            role: updatedUser.role,
            description: updatedUser.description,
        });
    }

    async updateUserRole(body: UpdateUserRoleRequest): Promise<void> {
        await this.userRepository.update(body.userId, { role: body.role });
    }
}
