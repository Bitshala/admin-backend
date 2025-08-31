import {
    CallHandler,
    ExecutionContext,
    Injectable,
    Logger,
    NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { defaultIfEmpty, tap } from 'rxjs/operators';

@Injectable()
export class ResponseLoggingInterceptor implements NestInterceptor {
    private logger = new Logger(ResponseLoggingInterceptor.name);

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        if (context.getType() !== 'http') {
            return next.handle();
        }

        const requestContext = context.switchToHttp().getRequest();

        const query = requestContext.query;
        const params = requestContext.params;
        const requestBody = requestContext.body;

        return next.handle().pipe(
            tap((data) => {
                if (data?.stream) {
                    data = 'response is a data stream, not logging it';
                }

                const request = {
                    message: requestContext.method,
                    path: requestContext.route.path,
                    query: query,
                    params: params,
                    body: requestBody,
                };
                const response = { body: data };

                this.logger.log(
                    JSON.stringify(
                        {
                            request,
                            response,
                        },
                        null,
                        2,
                    ),
                );
            }),

            defaultIfEmpty(null),
        );
    }
}
