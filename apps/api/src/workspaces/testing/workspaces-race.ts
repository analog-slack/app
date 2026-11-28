import { setTimeout } from 'node:timers/promises';

import type { Prisma, PrismaClient } from '@prisma/client';

export async function runInWorkspaceLockOrder(
  prisma: PrismaClient,
  workspaceId: string,
  requests: (() => Promise<Response>)[],
  beforeRelease?: (tx: Prisma.TransactionClient) => Promise<unknown>,
) {
  const responses: Promise<Response>[] = [];
  try {
    await prisma.$transaction(
      async (tx) => {
        await tx.$queryRaw`SELECT id FROM workspaces WHERE id = ${workspaceId}::uuid FOR UPDATE`;
        const [{ pid }] = await tx.$queryRaw<[{ pid: number }]>`SELECT pg_backend_pid() AS pid`;

        for (const request of requests) {
          const response = request();
          responses.push(response);
          let completed = false;
          void response.then(
            () => {
              completed = true;
            },
            () => {
              completed = true;
            },
          );
          const deadline = Date.now() + 2_000;
          for (;;) {
            const [{ count }] = await prisma.$queryRaw<[{ count: number }]>`
            WITH RECURSIVE waiters(pid) AS (
              SELECT ${pid}::int
              UNION
              SELECT active.pid FROM pg_stat_activity active
              JOIN waiters ON waiters.pid = ANY(pg_blocking_pids(active.pid))
            )
            SELECT (count(*) - 1)::int AS count FROM waiters
          `;
            if (count >= responses.length) break;
            if (completed || Date.now() >= deadline) {
              throw new Error('Request did not wait for the workspace lock');
            }
            await setTimeout(10);
          }
        }
        await beforeRelease?.(tx);
      },
      { timeout: 10_000 },
    );
    return await Promise.all(responses);
  } finally {
    await Promise.allSettled(responses);
  }
}
