import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { WinstonLogger } from './logger';
import { requestLogger } from './request-logger.middleware';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  // Parser JSON primeiro
  app.use(express.json());

  // Winston como logger global
  app.useLogger(WinstonLogger);

  // Middleware global de request/response
  app.use(requestLogger);

  await app.listen(3000, '0.0.0.0');
}
bootstrap();
