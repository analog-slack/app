import { createHash, randomBytes, randomUUID } from 'node:crypto';

import { GoneException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, type WorkspaceInviteLink } from '@prisma/client';

import { PrismaService } from '../prisma.service';
import { effectiveWorkspaceRole, WorkspaceAccessService } from './workspace-access.service';
import type {
  CreateWorkspaceInvitationDto,
  CreatedWorkspaceInvitationDto,
  WorkspaceInvitationDto,
  WorkspaceInvitationPreviewDto,
  WorkspaceInvitationStatus,
} from './workspace-invitations.dto';
import type { WorkspaceDto } from './workspaces.dto';
import { workspaceDto } from './workspaces.service';

const millisecondsPerDay = 86_400_000;

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

function invitationStatus(invitation: WorkspaceInviteLink, now: Date): WorkspaceInvitationStatus {
  if (invitation.revokedAt) return 'revoked';
  if (invitation.expiresAt && invitation.expiresAt <= now) return 'expired';
  return 'active';
}

function invitationDto(invitation: WorkspaceInviteLink, now: Date): WorkspaceInvitationDto {
  return {
    id: invitation.id,
    workspaceId: invitation.workspaceId,
    invitedBy: invitation.invitedBy,
    createdAt: invitation.createdAt.toISOString(),
    expiresAt: invitation.expiresAt?.toISOString() ?? null,
    revokedAt: invitation.revokedAt?.toISOString() ?? null,
    status: invitationStatus(invitation, now),
  };
}

@Injectable()
export class WorkspaceInvitationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: WorkspaceAccessService,
  ) {}

  create(
    workspaceId: string,
    actorId: string,
    { expiresInDays }: CreateWorkspaceInvitationDto,
  ): Promise<CreatedWorkspaceInvitationDto> {
    return this.access.withWorkspaceLock(workspaceId, async (tx) => {
      await this.access.requireRole(workspaceId, actorId, tx, 'owner', 'admin');
      const token = randomBytes(32).toString('base64url');
      const now = new Date();
      const invitation = await tx.workspaceInviteLink.create({
        data: {
          id: randomUUID(),
          workspaceId,
          invitedBy: actorId,
          tokenHash: hashToken(token),
          createdAt: now,
          expiresAt:
            expiresInDays === undefined
              ? null
              : new Date(now.getTime() + expiresInDays * millisecondsPerDay),
        },
      });
      return { ...invitationDto(invitation, now), token };
    });
  }

  list(workspaceId: string, actorId: string): Promise<WorkspaceInvitationDto[]> {
    return this.prisma.$transaction(
      async (tx) => {
        await this.access.requireRole(workspaceId, actorId, tx, 'owner', 'admin');
        const invitations = await tx.workspaceInviteLink.findMany({
          where: { workspaceId },
          orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        });
        const now = new Date();
        return invitations.map((invitation) => invitationDto(invitation, now));
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead },
    );
  }

  async revoke(workspaceId: string, actorId: string, invitationId: string): Promise<void> {
    await this.access.withWorkspaceLock(workspaceId, async (tx) => {
      await this.access.requireRole(workspaceId, actorId, tx, 'owner', 'admin');
      const where = { id: invitationId, workspaceId };
      const invitation = await tx.workspaceInviteLink.findUnique({
        where,
        select: { revokedAt: true },
      });
      if (!invitation) throw new NotFoundException('Invitation not found');
      if (!invitation.revokedAt) {
        await tx.workspaceInviteLink.update({ where, data: { revokedAt: new Date() } });
      }
    });
  }

  preview(token: string, actorId?: string): Promise<WorkspaceInvitationPreviewDto> {
    return this.prisma.$transaction(
      async (tx) => {
        const invitation = await tx.workspaceInviteLink.findUnique({
          where: { tokenHash: hashToken(token) },
          include: { workspace: { select: { id: true, name: true } } },
        });
        if (!invitation) throw new NotFoundException('Invitation not found');

        const { id, name } = invitation.workspace;
        const member =
          actorId &&
          (await tx.workspaceMember.findUnique({
            where: { workspaceId_userId: { workspaceId: id, userId: actorId } },
            select: { id: true },
          }));
        if (member) return { status: 'alreadyMember', workspaceId: id, workspaceName: name };

        const status = invitationStatus(invitation, new Date());
        return status === 'active' ? { status, workspaceName: name } : { status };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead },
    );
  }

  async accept(actorId: string, token: string): Promise<WorkspaceDto> {
    const locator = await this.prisma.workspaceInviteLink.findUnique({
      where: { tokenHash: hashToken(token) },
      select: { id: true, workspaceId: true },
    });
    if (!locator) throw new NotFoundException('Invitation not found');

    const { workspaceId } = locator;
    return this.access.withWorkspaceLock(workspaceId, async (tx) => {
      const invitation = await tx.workspaceInviteLink.findUnique({
        where: { id: locator.id, workspaceId },
        include: { workspace: true },
      });
      if (!invitation) throw new NotFoundException('Invitation not found');

      const { workspace } = invitation;
      const member = await tx.workspaceMember.findUnique({
        where: { workspaceId_userId: { workspaceId, userId: actorId } },
      });
      if (member)
        return workspaceDto(
          workspace,
          effectiveWorkspaceRole(workspace.ownerId, member.userId, member.role),
        );

      const now = new Date();
      if (invitationStatus(invitation, now) !== 'active') {
        throw new GoneException('Invitation is no longer active');
      }
      await tx.workspaceMember.create({
        data: { id: randomUUID(), workspaceId, userId: actorId, joinedAt: now },
      });
      return workspaceDto(workspace, 'member');
    });
  }
}
