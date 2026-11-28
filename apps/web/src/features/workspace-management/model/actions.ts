import type { AuthUserDto } from '@packages/api';
import { z } from 'zod';

import {
  addProject,
  changeMemberRole,
  createWorkspace,
  deleteWorkspace,
  invitationEmail,
  inviteMember,
  removeMember,
  removeProject,
  updateWorkspace,
  workspaceFields,
  workspaceRole,
  type Project,
  type WorkspaceRole,
  type WorkspaceSummary,
} from '@/entities/workspace';
import type { Dictionary } from '@/shared/i18n';

export type WorkspaceAction =
  | { kind: 'createWorkspace' }
  | { kind: 'editWorkspace'; workspace: WorkspaceSummary }
  | { kind: 'deleteWorkspace'; workspace: WorkspaceSummary }
  | { kind: 'addProject'; workspaceId: string }
  | { kind: 'removeProject'; project: Project }
  | { kind: 'inviteMember'; workspaceId: string }
  | { kind: 'removeMember'; workspaceId: string; memberId: string; name: string }
  | {
      kind: 'changeRole';
      workspaceId: string;
      memberId: string;
      name: string;
      role: WorkspaceRole;
    };

export function isDestructive(action: WorkspaceAction) {
  return (
    action.kind === 'deleteWorkspace' ||
    action.kind === 'removeProject' ||
    action.kind === 'removeMember'
  );
}

export function createActionSchema(action: WorkspaceAction, t: Dictionary['workspaces']) {
  return z
    .object({
      name: z.string().trim(),
      slug: z.string().trim().toLowerCase(),
      description: z.string().trim(),
      email: z.string().trim(),
      role: workspaceRole,
    })
    .superRefine((values, ctx) => {
      if (
        action.kind === 'createWorkspace' ||
        action.kind === 'editWorkspace' ||
        action.kind === 'addProject'
      ) {
        if (!workspaceFields.shape.name.safeParse(values.name).success) {
          ctx.addIssue({ code: 'custom', path: ['name'], message: t.validation.name });
        }
      }
      if (action.kind === 'createWorkspace' || action.kind === 'editWorkspace') {
        if (!workspaceFields.shape.slug.safeParse(values.slug).success) {
          ctx.addIssue({ code: 'custom', path: ['slug'], message: t.validation.slug });
        }
      }
      if (action.kind === 'inviteMember' && !invitationEmail.safeParse(values.email).success) {
        ctx.addIssue({ code: 'custom', path: ['email'], message: t.validation.email });
      }
    });
}

export type ActionValues = z.output<ReturnType<typeof createActionSchema>>;

export function submitAction(actor: AuthUserDto, action: WorkspaceAction, values: ActionValues) {
  const { name, slug, description, email, role } = values;
  switch (action.kind) {
    case 'createWorkspace':
      return createWorkspace(actor, { name, slug });
    case 'editWorkspace':
      return updateWorkspace(actor, action.workspace.id, { name, slug });
    case 'deleteWorkspace':
      return deleteWorkspace(actor, action.workspace.id);
    case 'addProject':
      return addProject(actor, action.workspaceId, { name, description });
    case 'removeProject':
      return removeProject(actor, action.project.workspaceId, action.project.id);
    case 'inviteMember':
      return inviteMember(actor, action.workspaceId, email);
    case 'removeMember':
      return removeMember(actor, action.workspaceId, action.memberId);
    case 'changeRole':
      return changeMemberRole(actor, action.workspaceId, action.memberId, role);
  }
}

export function getActionTarget(action: WorkspaceAction) {
  switch (action.kind) {
    case 'editWorkspace':
    case 'deleteWorkspace':
      return action.workspace.name;
    case 'removeProject':
      return action.project.name;
    case 'removeMember':
    case 'changeRole':
      return action.name;
    default:
      return undefined;
  }
}
