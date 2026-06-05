import {
  ClassSerializerInterceptor,
  ValidationPipe,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AppLoggerService, createLogger } from './common/logger';
import { setupSwagger } from './config/swagger.config';

async function bootstrap() {
  const bootstrapLogger = createLogger('Bootstrap');

  const app = await NestFactory.create(AppModule, {
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

  setupSwagger(app);

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);
  logger.log(`Application listening on port ${port}`);
}
bootstrap();
