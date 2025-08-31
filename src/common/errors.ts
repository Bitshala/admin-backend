import { HttpException, HttpStatus, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';

interface ErrorResponseMeta {
    errorCode?: string;
    details?: string;
}

export interface ErrorResponse {
    status: HttpStatus;
    message: string;
    errorId: string;
    meta?: ErrorResponseMeta;
}

export class BaseError extends Error {
    traceId: string;
    constructor(message: string, options?: ErrorOptions) {
        super(message, options);
        this.traceId = randomUUID();
        Object.setPrototypeOf(this, BaseError.prototype);
    }

    static fromError(error: Error): BaseError {
        const asyncError = new BaseError(error.message, { cause: error });
        asyncError.stack = error.stack;
        return asyncError;
    }
}

export class ServiceError extends BaseError {
    errorId: string;
    constructor(message: string, options?: ErrorOptions) {
        super(message, options);
        this.errorId = Buffer.from(this.traceId.replace(/-/g, ''), 'hex')
            .toString('base64')
            .replace(/[=+\/]/g, '')
            .slice(0, 7);
        Object.setPrototypeOf(this, ServiceError.prototype);
    }

    static fromError(error: Error | BaseError): ServiceError {
        const syncError = new ServiceError(error.message, { cause: error });
        syncError.stack = error.stack;
        return syncError;
    }

    toInternalError(metadata?: ErrorResponseMeta): HttpException {
        return new HttpException(
            {
                status: HttpStatus.INTERNAL_SERVER_ERROR,
                message: `Internal Error! Please try again later or contact support with the following error ID: ${this.errorId}`,
                errorId: this.errorId,
                meta: metadata,
            } as ErrorResponse,
            HttpStatus.INTERNAL_SERVER_ERROR,
            { cause: this },
        );
    }

    private logCauseRecursive(logger: Logger, error: Error) {
        if (error instanceof AggregateError) {
            logger.error(
                `Aggregate Error encountered: ${error.message}`,
                error.stack,
            );
            for (const cause of error.errors) {
                this.logCauseRecursive(logger, cause);
            }

            return;
        }

        logger.error(`Cause: ${error.message}`, error.stack);
        if (error.cause) this.logCauseRecursive(logger, error.cause as Error);
    }

    logError(logger: Logger) {
        logger.error(
            `Error Id: ${this.errorId}, Trace Id: ${this.traceId} Message: ${this.message}`,
            this.stack,
        );
        if (this.cause) this.logCauseRecursive(logger, this.cause as Error);
    }
}

export class ApiError extends ServiceError {
    constructor(
        message: string,
        public responseCode = HttpStatus.INTERNAL_SERVER_ERROR,
        options?: ErrorOptions,
        public metadata?: ErrorResponseMeta,
    ) {
        super(message, options);
        Object.setPrototypeOf(this, ApiError.prototype);
    }

    static fromHttpException(
        exception: HttpException,
        metadata?: ErrorResponseMeta,
    ): ApiError {
        const response = exception.getResponse();
        if (typeof response === 'string') {
            return new ApiError(
                response,
                exception.getStatus(),
                {
                    cause: exception,
                },
                metadata,
            );
        } else {
            /*
             * when we do new HttpException('some error message', 400)
             * NESTJS wraps it in an object with statusCode and message
             * so response will be { statusCode: 400, message: 'some error message' }
             * we want to extract the message and use it as the response
             * if the message is not a string, we will use the default error message (like in case of Validation errors)
             *  */
            const statusCode = (response as any).statusCode;
            const message = (response as any).message;
            if (statusCode && message && typeof message === 'string')
                return new ApiError(
                    message,
                    statusCode,
                    {
                        cause: exception,
                    },
                    metadata,
                );
            else {
                const error = new ApiError(
                    '',
                    exception.getStatus(),
                    {
                        cause: exception,
                    },
                    metadata,
                );
                error.message = `Internal Error! Please try again later or contact support with the following error ID: ${error.errorId}`;
                return error;
            }
        }
    }

    toHttpException(): HttpException {
        return new HttpException(
            {
                status: this.responseCode,
                message:
                    this.responseCode === HttpStatus.INTERNAL_SERVER_ERROR
                        ? `${this.message} Error Id: ${this.errorId}`
                        : this.message,
                errorId: this.errorId,
                meta: this.metadata,
            } as ErrorResponse,
            this.responseCode,
            { cause: this },
        );
    }
}
