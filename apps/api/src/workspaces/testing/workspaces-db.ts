import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { cpSync, mkdirSync, mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

import { PrismaClient } from '@prisma/client';

const prismaDirectory = resolve(__dirname, '../../../prisma');

export function deployWorkspaceTestDb(url: string, throughMigration?: string) {
  const temporary = throughMigration ? mkdtempSync(join(tmpdir(), 'workspace-prisma-')) : undefined;
  try {
    if (temporary && throughMigration) {
      const migrations = join(temporary, 'migrations');
      mkdirSync(migrations);
      cpSync(join(prismaDirectory, 'schema.prisma'), join(temporary, 'schema.prisma'));
      const source = join(prismaDirectory, 'migrations');
      for (const name of readdirSync(source)) {
        if (name <= throughMigration || name === 'migration_lock.toml') {
          cpSync(join(source, name), join(migrations, name), { recursive: true });
        }
      }
    }

    execFileSync(process.execPath, [
      require.resolve('prisma/build/index.js'), 'migrate', 'deploy', '--schema',
      join(temporary ?? prismaDirectory, 'schema.prisma'),
    ], { env: { ...process.env, DATABASE_URL: url }, stdio: 'pipe' });
  } finally {
    if (temporary) rmSync(temporary, { recursive: true, force: true });
  }
}

export async function openWorkspaceTestDb({ deploy = true } = {}) {
  const databaseUrl = process.env.WORKSPACES_TEST_DATABASE_URL;
  if (!databaseUrl) throw new Error('Set WORKSPACES_TEST_DATABASE_URL to a dedicated PostgreSQL test database');

  const schema = `workspaces_test_${randomUUID().replaceAll('-', '')}`;
  const url = new URL(databaseUrl);
  url.searchParams.set('schema', schema);
  const prisma = new PrismaClient({ datasourceUrl: url.href });

  async function close() {
    try {
      await prisma.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
    } finally {
      await prisma.$disconnect();
    }
  }

  try {
    await prisma.$executeRawUnsafe(`CREATE SCHEMA "${schema}"`);
    if (deploy) deployWorkspaceTestDb(url.href);
    return { url: url.href, prisma, close };
  } catch (error) {
    await close();
    throw error;
  }
}
