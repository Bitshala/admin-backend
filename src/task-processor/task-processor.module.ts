import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APITask } from '@/entities/api-task.entity';
import { APITaskProcessorService } from '@/task-processor/task-processor.service';
import { DbTransactionModule } from '@/db-transaction/db-transaction.module';

@Module({
    imports: [TypeOrmModule.forFeature([APITask]), DbTransactionModule],
    providers: [APITaskProcessorService],
    exports: [TypeOrmModule, APITaskProcessorService],
    controllers: [],
})
export class TaskProcessorModule {}
