import {
  ClassSerializerInterceptor,
  ValidationPipe,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { AppLoggerService, createLogger } from './common/logger';
import { setupCors } from './config/cors.config';
import { setupSwagger } from './config/swagger.config';

let cachedApp: NestExpressApplication | undefined;

export async function createNestApp(): Promise<NestExpressApplication> {
  if (cachedApp) {
    return cachedApp;
  }

  const bootstrapLogger = createLogger('Bootstrap');
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
    logger: bootstrapLogger,
  });

  const logger = app.get(AppLoggerService);
  app.useLogger(logger);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalInterceptors(
    new ClassSerializerInterceptor(app.get(Reflector)),
  );

  setupCors(app);
  setupSwagger(app);
  await app.init();

  cachedApp = app;
  return app;
}

export async function startLocalServer(): Promise<void> {
  const app = await createNestApp();
  const logger = app.get(AppLoggerService);
  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);
  logger.log(`Application listening on port ${port}`);
}
