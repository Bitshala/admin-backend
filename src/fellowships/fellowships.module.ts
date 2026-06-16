import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Fellowship } from '@/entities/fellowship.entity';
import { FellowshipsService } from '@/fellowships/fellowships.service';
import { FellowshipsController } from '@/fellowships/fellowships.controller';
import { FellowshipDocumentsModule } from '@/fellowship-documents/fellowship-documents.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Fellowship]),
        FellowshipDocumentsModule,
    ],
    providers: [FellowshipsService],
    controllers: [FellowshipsController],
    exports: [FellowshipsService],
})
export class FellowshipsModule {}
