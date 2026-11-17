import './instrument';

import { NestFactory } from '@nestjs/core';
import { SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app.module';
import { createOpenApiDocument } from './openapi';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: process.env.CORS_ORIGIN ?? 'http://localhost:3000', credentials: true });

  SwaggerModule.setup('docs', app, () => createOpenApiDocument(app));

  await app.listen(process.env.PORT ?? 4000);
}

void bootstrap();
