import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '@/entities/user.entity';
import { UsersService } from '@/users/users.service';
import { UsersController } from '@/users/users.controller';
import { ScoresModule } from '@/scores/scores.module';
import { CertificatesModule } from '@/certificates/certificates.module';
import { FellowshipsModule } from '@/fellowships/fellowships.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([User]),
        ScoresModule,
        CertificatesModule,
        FellowshipsModule,
    ],
    providers: [UsersService],
    controllers: [UsersController],
    exports: [UsersService],
})
export class UsersModule {}
