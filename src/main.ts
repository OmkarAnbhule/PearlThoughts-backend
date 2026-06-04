import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AppLoggerService, createLogger } from './common/logger';

async function bootstrap() {
  const bootstrapLogger = createLogger('Bootstrap');

  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
    logger: bootstrapLogger,
  });

  const logger = app.get(AppLoggerService);
  app.useLogger(logger);

  const config = new DocumentBuilder()
    .setTitle('Hospital Management System')
    .setDescription('Hospital management system')
    .setVersion('1.0')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);
  logger.log(`Application listening on port ${port}`);
}
bootstrap();
