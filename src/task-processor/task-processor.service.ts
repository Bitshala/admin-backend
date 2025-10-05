import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EntityManager } from 'typeorm';
import { DbTransactionService } from '@/db-transaction/db-transaction.service';
import { APITask } from '@/entities/api-task.entity';
import { APITaskStatus, TaskType } from '@/task-processor/task.enums';
import { ApiError, ServiceError } from '@/common/errors';
import { CohortsService } from '@/cohorts/cohorts.service';

@Injectable()
export class APITaskProcessorService {
    private readonly logger = new Logger(APITaskProcessorService.name);
    private readonly MESSAGE_BATCH_SIZE = 10;

    constructor(
        private readonly dbTransactionService: DbTransactionService,
        private readonly cohortsService: CohortsService,
    ) {}

    private async fetchUnprocessedTasks(): Promise<APITask<any>[]> {
        const queryResult = await this.dbTransactionService.execute(
            async (manager: EntityManager) => {
                return manager.query(`
                    UPDATE
                        api_task ca
                    SET
                        "status" = '${APITaskStatus.PROCESSING}',
                        "processStartTime" = '${new Date().toISOString()}'::timestamptz
                    FROM (
                        SELECT
                            "id",
                            "type",
                            "data",
                            "status",
                            "processStartTime",
                            "retryCount",
                            "retryLimit"
                        FROM
                            api_task
                        WHERE
                            ("status" = '${
                                APITaskStatus.UNPROCESSED
                            }' AND "executeOnTime" <= '${new Date().toISOString()}'::timestamptz)  OR
                            (status = 'FAILED' AND "retryCount" < "retryLimit" AND "lastRetryTime" < '${new Date().toISOString()}'::timestamptz - (2 ^ ("retryCount" - 1)) * INTERVAL '8 seconds')
                        ORDER BY
                            "updatedAt"
                        LIMIT ${this.MESSAGE_BATCH_SIZE}
                        FOR UPDATE SKIP LOCKED) sub
                    WHERE
                        ca. "id" = sub. "id"
                    RETURNING *;
                    `);
            },
        );
        return queryResult[0];
    }

    private async processTask(task: APITask<any>): Promise<void> {
        this.logger.log(`Processing task ${task.id}`);

        task.status = APITaskStatus.PROCESSING;

        try {
            switch (task.type) {
                case TaskType.ASSIGN_COHORT_ROLE:
                    await this.cohortsService.assignDiscordRole(
                        task.data.userId,
                        task.data.cohortType,
                    );
                    break;
                default:
                    throw new ApiError(
                        `Unknown task type ${task.type} for task ${task.id}`,
                    );
            }
        } catch (error) {
            this.logger.error(`Failed Task: ${error.message}`, error.stack);

            let wrappedError: ServiceError = error;
            if (!(error instanceof ServiceError)) {
                wrappedError = new ServiceError(error.message, error.stack);
            }

            await this.dbTransactionService.execute(async (manager) => {
                await manager.update(
                    APITask,
                    { id: task.id },
                    {
                        status: APITaskStatus.FAILED,
                        retryCount: task.retryCount + 1,
                        lastRetryTime: new Date(),
                        lastExecutionFailureDetails: error.message,
                    },
                );
            });

            wrappedError.logError(this.logger);
            return;
        }

        this.logger.log(`Task ${task.id} processed successfully`);

        await this.dbTransactionService.execute(async (manager) => {
            await manager.update(
                APITask,
                { id: task.id },
                {
                    status: APITaskStatus.PROCESSED,
                },
            );
        });
    }

    @Cron(CronExpression.EVERY_10_SECONDS)
    processTasks(): void {
        this.fetchUnprocessedTasks()
            .then(async (tasks) => {
                await Promise.all(
                    tasks.map((task) => this.processTask(task), this),
                );
            })
            .catch((error) => {
                this.logger.error(error, error.stack);
            });
    }
}
