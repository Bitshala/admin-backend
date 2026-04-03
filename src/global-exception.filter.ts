import {
    ArgumentsHost,
    BadRequestException,
    Catch,
    HttpException,
    Injectable,
    Logger,
} from '@nestjs/common';
import { BaseExceptionFilter, HttpAdapterHost } from '@nestjs/core';
import { QueryFailedError } from 'typeorm';
import { ApiError, ServiceError } from '@/common/errors';
import { DiscordAlertService } from '@/common/discord-alert.service';

@Injectable()
@Catch()
export class AllExceptionsFilter extends BaseExceptionFilter {
    private logger = new Logger('Exceptions');

    constructor(
        httpAdapterHost: HttpAdapterHost,
        private readonly discordAlert: DiscordAlertService,
    ) {
        super(httpAdapterHost.httpAdapter);
    }

    catch(exception: Error, host: ArgumentsHost): void {
        if (exception instanceof BadRequestException) {
            const response = exception.getResponse();
            if (
                typeof response === 'object' &&
                'message' in response &&
                Array.isArray(response.message)
            ) {
                const errors = response.message.join(', ');
                return super.catch(new BadRequestException(errors), host);
            }
        }

        let wrappedException: ServiceError;
        let httpException: HttpException;

        if (exception instanceof QueryFailedError) {
            wrappedException = new ServiceError(exception.message, {
                cause: exception,
            });
            this.logger.error(
                `Query: ${exception.query}, Parameters: ${exception.parameters}`,
            );
            httpException = wrappedException.toInternalError();
        } else if (exception instanceof ApiError) {
            wrappedException = exception;
            httpException = exception.toHttpException();
        } else if (exception instanceof HttpException) {
            const serviceError = ApiError.fromHttpException(exception);
            wrappedException = serviceError;
            httpException = serviceError.toHttpException();
        } else if (exception instanceof ServiceError) {
            wrappedException = exception;
            httpException = exception.toInternalError();
        } else {
            const serviceError = ApiError.fromError(exception);
            wrappedException = serviceError;
            httpException = serviceError.toInternalError();
        }

        wrappedException.logError(this.logger);

        const ctx = host.switchToHttp();
        const request = ctx.getRequest();
        const status = httpException.getStatus();

        if (status >= 500) {
            void this.discordAlert.sendErrorAlert(wrappedException, {
                type: 'http',
                method: request?.method,
                url: request?.url,
            });
        }

        super.catch(httpException, host);
    }
}
