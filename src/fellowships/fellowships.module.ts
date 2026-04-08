import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Fellowship } from '@/entities/fellowship.entity';
import { FellowshipsService } from '@/fellowships/fellowships.service';
import { FellowshipsController } from '@/fellowships/fellowships.controller';

@Module({
    imports: [TypeOrmModule.forFeature([Fellowship])],
    providers: [FellowshipsService],
    controllers: [FellowshipsController],
    exports: [FellowshipsService],
})
export class FellowshipsModule {}
