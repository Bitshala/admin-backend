import {
    utilities as nestWinstonModuleUtilities,
    WinstonModuleOptions,
} from 'nest-winston';
import * as winston from 'winston';

const customFormat = winston.format.printf(
    ({ timestamp, level, context, message }) => {
        return `[${timestamp}] [${level.toUpperCase()}] [${
            context || 'Application'
        }] ${message}`;
    },
);

export const winstonConfig: WinstonModuleOptions = {
    transports: [
        // File transport - logs everything to log.txt
        new winston.transports.File({
            filename: 'app.log',
            format: winston.format.combine(
                winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
                winston.format.errors({ stack: true }),
                customFormat,
            ),
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        }),
        // Console transport - for development
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.ms(),
                nestWinstonModuleUtilities.format.nestLike(),
            ),
        }),
    ],
};
