import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APITask } from '@/entities/api-task.entity';
import { APITaskProcessorService } from '@/task-processor/task-processor.service';
import { DbTransactionModule } from '@/db-transaction/db-transaction.module';
import { CohortsModule } from '@/cohorts/cohorts.module';
import { GitHubClassroomModule } from '@/github-classroom/github-classroom.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([APITask]),
        DbTransactionModule,
        CohortsModule,
        GitHubClassroomModule,
    ],
    providers: [APITaskProcessorService],
    exports: [TypeOrmModule, APITaskProcessorService],
    controllers: [],
})
export class TaskProcessorModule {}
