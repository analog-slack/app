import { writeFile } from 'node:fs/promises';

import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';
import { createOpenApiDocument } from './openapi';

async function exportOpenApi() {
  const app = await NestFactory.create(AppModule, { logger: false });
  try {
    const path = process.argv[2];
    if (!path) throw new Error('Specify an OpenAPI output path');
    await writeFile(path, JSON.stringify(createOpenApiDocument(app), null, 2) + '\n');
  } finally {
    await app.close();
  }
}

void exportOpenApi();
