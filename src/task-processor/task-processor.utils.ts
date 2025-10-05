import { APITask } from '@/entities/api-task.entity';

export const isLastRetry = (
    task: Pick<APITask<any>, 'retryCount' | 'retryLimit'>,
): boolean => {
    return task.retryCount + 1 >= task.retryLimit;
};
