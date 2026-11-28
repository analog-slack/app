import { randomUUID } from 'node:crypto';

import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';

import { AppModule } from '../../app.module';
import { PrismaService } from '../../prisma.service';
import { openWorkspaceTestDb } from './workspaces-db';

export async function openWorkspaceHttp() {
  const db = await openWorkspaceTestDb();
  try {
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue(db.prisma)
      .overrideProvider(ConfigService)
      .useValue(
        new ConfigService({
          AUTH_JWT_SECRET: randomUUID(),
          CORS_ORIGIN: 'http://localhost:3000',
        }),
      )
      .compile();
    const app = module.createNestApplication({ logger: false });
    try {
      await app.listen(0, '127.0.0.1');
      const origin = await app.getUrl();

      function request(
        path: string,
        method = 'GET',
        cookie?: string,
        body?: object,
        requestOrigin?: string,
      ) {
        return fetch(origin + path, {
          method,
          headers: {
            ...(cookie && { cookie }),
            ...(body && { 'content-type': 'application/json' }),
            ...(requestOrigin && { origin: requestOrigin }),
          },
          body: body && JSON.stringify(body),
        });
      }

      async function register() {
        const username = randomUUID();
        const response = await request('/auth/register', 'POST', undefined, {
          username,
          email: username + '@example.test',
          password: 'integration password',
        });
        expect(response.status).toBe(200);
        const cookie = response.headers
          .getSetCookie()
          .map((value) => value.split(';', 1)[0])
          .join('; ');
        const user: { id: string } = (await response.json()).user;
        return { ...user, cookie };
      }

      async function createWorkspace(cookie: string, slug: string = randomUUID()) {
        const response = await request('/workspaces', 'POST', cookie, {
          name: '  Example  ',
          slug,
        });
        expect(response.status).toBe(201);
        const workspace: { id: string; slug: string; role: string; ownerId: string; name: string } =
          await response.json();
        return workspace;
      }

      async function close() {
        try {
          await app.close();
        } finally {
          await db.close();
        }
      }

      return { app, db, request, register, createWorkspace, close };
    } catch (error) {
      await app.close();
      throw error;
    }
  } catch (error) {
    await db.close();
    throw error;
  }
}
