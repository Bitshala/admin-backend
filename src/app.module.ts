import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from '@/app.controller';
import { AppService } from '@/app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import configuration from '@/configuration';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { entities } from '@/entities/entities';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AllExceptionsFilter } from '@/global-exception.filter';
import { RequestLoggerMiddleware } from '@/middlewares/logger.middleware';
import { ResponseLoggingInterceptor } from '@/interceptors/response-logger.interceptor';
import { CohortsModule } from '@/cohorts/cohorts.module';
import { UsersModule } from '@/users/users.module';
import { AuthModule } from '@/auth/auth.module';
import { AuthGuard } from '@/auth/auth.guard';
import { RolesGuard } from '@/auth/roles.guard';
import { createKeyv } from '@keyv/redis';
import { ScoresModule } from '@/scores/scores.module';
import { TaskProcessorModule } from '@/task-processor/task-processor.module';
import { WinstonModule } from 'nest-winston';
import { winstonConfig } from '@/common/logger.config';
import { FeedbackModule } from '@/feedback/feedback.module';
import { MailModule } from '@/mail/mail.module';

@Module({
    imports: [
        WinstonModule.forRoot(winstonConfig),
        ScheduleModule.forRoot(),
        EventEmitterModule.forRoot(),
        CacheModule.registerAsync({
            isGlobal: true,
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                stores: [
                    createKeyv(configService.getOrThrow('cache.redis.url')),
                ],
            }),
        }),
        ConfigModule.forRoot({
            ignoreEnvFile: true,
            load: [configuration],
            isGlobal: true,
        }),
        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                type: 'postgres',
                host: configService.get<string>('db.postgres.host'),
                port: configService.get<number>('db.postgres.port'),
                username: configService.get<string>('db.postgres.username'),
                password: configService.get<string>('db.postgres.password'),
                database: configService.get<string>('db.postgres.databaseName'),
                synchronize: configService.get<boolean>('db.synchronize'),
                autoLoadEntities: true,
                entities: entities,
            }),
        }),
        ThrottlerModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => [
                {
                    ttl: configService.get<number>('throttler.ttl', 1000),
                    limit: configService.get<number>('throttler.limit', 5),
                },
            ],
        }),
        AuthModule,
        CohortsModule,
        UsersModule,
        ScoresModule,
        TaskProcessorModule,
        FeedbackModule,
        MailModule,
    ],
    controllers: [AppController],
    providers: [
        AppService,
        {
            provide: APP_FILTER,
            useClass: AllExceptionsFilter,
        },
        {
            provide: APP_INTERCEPTOR,
            useClass: ResponseLoggingInterceptor,
        },
        {
            provide: APP_GUARD,
            useClass: ThrottlerGuard,
        },
        {
            provide: APP_GUARD,
            useClass: AuthGuard,
        },
        {
            provide: APP_GUARD,
            useClass: RolesGuard,
        },
    ],
})
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer): void {
        consumer.apply(RequestLoggerMiddleware).forRoutes('*');
    }
}
