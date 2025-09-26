import { NestFactory } from '@nestjs/core';
import { AppModule } from '@/app.module';
import { ConfigService } from '@nestjs/config';
import { LogLevel, ValidationPipe } from '@nestjs/common';
import { WsAdapter } from '@nestjs/platform-ws';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

declare const module: any;

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    app.useWebSocketAdapter(new WsAdapter(app));

    const configService = app.get<ConfigService>(ConfigService);
    const port = configService.get<number>('app.port') || 3000;

    const isVerbose = configService.get<boolean>('app.verbose') ?? false;
    const isDebug = configService.get<boolean>('app.debug') ?? false;

    const loggerLevels: LogLevel[] = ['error', 'warn', 'log'];

    if (isVerbose) loggerLevels.push('verbose');
    if (isDebug) loggerLevels.push('debug');

    app.useLogger(loggerLevels);
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    app.enableCors({
        origin: '*',
    });

    const config = new DocumentBuilder()
        .setTitle('Bitshala API')
        .setDescription('API documentation for Bitshala')
        .addBearerAuth()
        .build();
    const documentFactory = () => SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, documentFactory);

    await app.listen(port);

    if (module.hot) {
        module.hot.accept();
        module.hot.dispose(() => app.close());
    }
}
bootstrap();
