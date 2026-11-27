import { randomUUID } from 'node:crypto';

import { ConflictException, ForbiddenException, Injectable } from '@nestjs/common';
import { Prisma, type Workspace, type WorkspaceMemberRole } from '@prisma/client';

import { PrismaService } from '../prisma.service';
import {
  effectiveWorkspaceRole,
  WorkspaceAccessService,
  type WorkspaceRole,
} from './workspace-access.service';
import type { CreateWorkspaceDto, WorkspaceDto, WorkspaceMemberDto } from './workspaces.dto';

const memberUser = { select: { username: true, avatarUrl: true } } satisfies Prisma.UserDefaultArgs;

function memberDto(
  {
    userId,
    joinedAt,
    role,
    user,
  }: Prisma.WorkspaceMemberGetPayload<{ include: { user: typeof memberUser } }>,
  ownerId: string,
): WorkspaceMemberDto {
  return {
    userId,
    username: user.username,
    avatarUrl: user.avatarUrl,
    joinedAt: joinedAt?.toISOString() ?? null,
    role: effectiveWorkspaceRole(ownerId, userId, role),
  };
}

export function workspaceDto(workspace: Workspace, role: WorkspaceRole): WorkspaceDto {
  return { ...workspace, createdAt: workspace.createdAt?.toISOString() ?? null, role };
}

@Injectable()
export class WorkspacesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: WorkspaceAccessService,
  ) {}

  async create(userId: string, dto: CreateWorkspaceDto): Promise<WorkspaceDto> {
    const now = new Date();
    try {
      const workspace = await this.prisma.workspace.create({
        data: {
          id: randomUUID(),
          name: dto.name,
          slug: dto.slug,
          ownerId: userId,
          createdAt: now,
          members: { create: { id: randomUUID(), userId, joinedAt: now } },
        },
      });
      return workspaceDto(workspace, 'owner');
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002' &&
        Array.isArray(error.meta?.target) &&
        error.meta.target.includes('slug')
      ) {
        throw new ConflictException('Workspace slug already exists');
      }
      throw error;
    }
  }

  async list(userId: string): Promise<WorkspaceDto[]> {
    const memberships = await this.prisma.$transaction(
      (tx) =>
        tx.workspaceMember.findMany({
          where: { userId },
          include: { workspace: true },
          orderBy: { workspace: { slug: 'asc' } },
        }),
      { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead },
    );
    return memberships.map(({ workspace, role }) =>
      workspaceDto(workspace, effectiveWorkspaceRole(workspace.ownerId, userId, role)),
    );
  }

  async get(workspaceId: string, userId: string): Promise<WorkspaceDto> {
    const { workspace, role } = await this.access.requireMembership(workspaceId, userId);
    return workspaceDto(workspace, role);
  }

  async listMembers(workspaceId: string, actorId: string): Promise<WorkspaceMemberDto[]> {
    return this.prisma.$transaction(
      async (tx) => {
        const { workspace } = await this.access.requireMembership(workspaceId, actorId, tx);
        const members = await tx.workspaceMember.findMany({
          where: { workspaceId },
          include: { user: memberUser },
          orderBy: { userId: 'asc' },
        });
        return members.map((member) => memberDto(member, workspace.ownerId));
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead },
    );
  }

  async updateMemberRole(
    workspaceId: string,
    actorId: string,
    targetId: string,
    role: WorkspaceMemberRole,
  ): Promise<WorkspaceMemberDto> {
    return this.access.withWorkspaceLock(workspaceId, async (tx) => {
      const { workspace } = await this.access.requireRole(workspaceId, actorId, tx, 'owner');
      const target = await this.access.requireMembership(workspaceId, targetId, tx);
      if (target.role === 'owner')
        throw new ConflictException('Cannot change the role of the workspace owner');

      const member = await tx.workspaceMember.update({
        where: { workspaceId_userId: { workspaceId, userId: targetId } },
        data: { role },
        include: { user: memberUser },
      });
      return memberDto(member, workspace.ownerId);
    });
  }

  async removeMember(workspaceId: string, actorId: string, targetId: string): Promise<void> {
    await this.access.withWorkspaceLock(workspaceId, async (tx) => {
      const actor = await this.access.requireRole(workspaceId, actorId, tx, 'owner', 'admin');
      const target = await this.access.requireMembership(workspaceId, targetId, tx);
      if (target.role === 'owner') throw new ConflictException('Cannot remove the workspace owner');
      if (actor.role === 'admin' && target.role === 'admin') throw new ForbiddenException();

      await tx.workspaceMember.delete({
        where: { workspaceId_userId: { workspaceId, userId: targetId } },
      });
    });
  }

  async transferOwnership(
    workspaceId: string,
    actorId: string,
    targetId: string,
  ): Promise<WorkspaceDto> {
    return this.access.withWorkspaceLock(workspaceId, async (tx) => {
      await this.access.requireRole(workspaceId, actorId, tx, 'owner');
      if (actorId === targetId)
        throw new ConflictException('Workspace owner cannot transfer ownership to themselves');
      await this.access.requireMembership(workspaceId, targetId, tx);

      const workspace = await tx.workspace.update({
        where: { id: workspaceId },
        data: { ownerId: targetId },
      });
      await tx.workspaceMember.update({
        where: { workspaceId_userId: { workspaceId, userId: actorId } },
        data: { role: 'admin' },
      });
      return workspaceDto(workspace, 'admin');
    });
  }
}
