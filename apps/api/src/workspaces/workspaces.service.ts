import { randomUUID } from 'node:crypto';

import { ConflictException, Injectable } from '@nestjs/common';
import { Prisma, type Workspace } from '@prisma/client';

import { PrismaService } from '../prisma.service';
import {
  effectiveWorkspaceRole,
  WorkspaceAccessService,
  type WorkspaceRole,
} from './workspace-access.service';
import type { CreateWorkspaceDto, WorkspaceDto } from './workspaces.dto';

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
}
