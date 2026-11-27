import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, type Workspace, type WorkspaceMemberRole } from '@prisma/client';

import { PrismaService } from '../prisma.service';

export type WorkspaceRole = WorkspaceMemberRole | 'owner';
export const workspaceRoles = ['owner', 'admin', 'member'] as const;

export function effectiveWorkspaceRole(
  ownerId: string,
  userId: string,
  role: WorkspaceMemberRole,
): WorkspaceRole {
  return ownerId === userId ? 'owner' : role;
}

@Injectable()
export class WorkspaceAccessService {
  constructor(private readonly prisma: PrismaService) {}

  async requireMembership(
    workspaceId: string,
    userId: string,
    db?: Prisma.TransactionClient,
  ): Promise<{ workspace: Workspace; role: WorkspaceRole }> {
    if (!db) {
      return this.prisma.$transaction((tx) => this.requireMembership(workspaceId, userId, tx), {
        isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead,
      });
    }

    const membership = await db.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
      include: { workspace: true },
    });
    if (!membership) throw new NotFoundException('Workspace not found');

    return {
      workspace: membership.workspace,
      role: effectiveWorkspaceRole(membership.workspace.ownerId, userId, membership.role),
    };
  }
}
