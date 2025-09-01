import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '@/entities/user.entity';
import { Repository } from 'typeorm';
import { UserRole } from '@/common/enum';
import { randomUUID } from 'crypto';

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

        if (user) {
            user.discordUserName = data.discordUsername;
            user.discordGlobalName = data.discordGlobalName;
            user.email = data.email;
            return this.userRepository.save(user);
        } else {
            return this.createStudentUser(data);
        }
    }
}
