import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '@/entities/user.entity';
import { TeachingAssistantsService } from '@/teaching-assistants/teaching-assistants.service';
import { TeachingAssistantsController } from '@/teaching-assistants/teaching-assistants.controller';

@Module({
    imports: [TypeOrmModule.forFeature([User])],
    providers: [TeachingAssistantsService],
    controllers: [TeachingAssistantsController],
})
export class TeachingAssistantsModule {}
