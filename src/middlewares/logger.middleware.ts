import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
    private logger = new Logger(RequestLoggerMiddleware.name);

    use(request: Request, response: Response, next: NextFunction): void {
        const startTime = process.hrtime();
        const { ip, method, baseUrl } = request;
        const userAgent = request.get('user-agent') || '';

        this.logger.log(`Request: ${method} ${baseUrl} - ${userAgent} ${ip}`);

        response.on('finish', () => {
            const { statusCode } = response;
            const finishTime = process.hrtime(startTime);
            const responseTime = finishTime[0] * 1e3 + finishTime[1] * 1e-6;
            this.logger.log(
                `Response: ${method} ${baseUrl} ${statusCode} ${responseTime}ms - ${userAgent} ${ip}`,
            );
        });

        next();
    }
}
