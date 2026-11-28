import type { AuthUserDto } from '@packages/api';

import { canManageMember, canManageWorkspace } from '../model/permissions';
import {
  invitationEmail,
  projectFields,
  type MemberProfile,
  type PendingInvitation,
  type Project,
  type ProjectInput,
  type Workspace,
  type WorkspaceAccess,
  type WorkspaceData,
  type WorkspaceInput,
  type WorkspaceRole,
  type WorkspaceSummary,
  workspaceData,
  workspaceFields,
  workspaceRole,
} from '../model/types';
import { createMockData } from './mock-data';

export type WorkspaceErrorCode =
  'notFound' | 'forbidden' | 'slugTaken' | 'alreadyMember' | 'alreadyInvited';

export class WorkspaceError extends Error {
  constructor(readonly code: WorkspaceErrorCode) {
    super(code);
  }
}

function saveData(actor: AuthUserDto, data: WorkspaceData) {
  sessionStorage.setItem(`analog-workspaces:v1:${actor.id}`, JSON.stringify(data));
}

function readData(actor: AuthUserDto): WorkspaceData {
  const raw = sessionStorage.getItem(`analog-workspaces:v1:${actor.id}`);
  if (raw !== null) return workspaceData.parse(JSON.parse(raw));

  const data = createMockData(actor);
  saveData(actor, data);
  return data;
}

function getAccess(
  data: WorkspaceData,
  workspace: Workspace,
  userId: string,
): WorkspaceAccess | null {
  if (workspace.ownerId === userId) return 'owner';
  const member = data.members.find(
    (item) => item.workspaceId === workspace.id && item.userId === userId,
  );
  return member ? (member.role === 'admin' ? 'admin' : 'member') : null;
}

function getProfiles(
  data: WorkspaceData,
  workspace: Workspace,
  actor: AuthUserDto,
): MemberProfile[] {
  const members = data.members.filter((member) => member.workspaceId === workspace.id);
  const people = [actor, ...data.users];
  const owner = people.find((user) => user.id === workspace.ownerId);
  const profiles: MemberProfile[] = owner
    ? [{ id: owner.id, userId: owner.id, user: owner, access: 'owner' }]
    : [];

  for (const member of members) {
    const user = people.find((person) => person.id === member.userId);
    if (user && user.id !== workspace.ownerId) {
      profiles.push({
        id: member.id,
        userId: user.id,
        user,
        access: member.role === 'admin' ? 'admin' : 'member',
      });
    }
  }

  return profiles;
}

function summarize(
  data: WorkspaceData,
  workspace: Workspace,
  access: WorkspaceAccess,
): WorkspaceSummary {
  return {
    ...workspace,
    access,
    memberCount:
      1 +
      data.members.filter(
        (member) => member.workspaceId === workspace.id && member.userId !== workspace.ownerId,
      ).length,
    projectCount: data.projects.filter((project) => project.workspaceId === workspace.id).length,
  };
}

function requireAccess(data: WorkspaceData, id: string, actor: AuthUserDto) {
  const workspace = data.workspaces.find((item) => item.id === id);
  const access = workspace && getAccess(data, workspace, actor.id);
  if (!workspace || !access) throw new WorkspaceError('notFound');
  return { workspace, access };
}

function requireManager(data: WorkspaceData, id: string, actor: AuthUserDto) {
  const result = requireAccess(data, id, actor);
  if (!canManageWorkspace(result.access)) throw new WorkspaceError('forbidden');
  return result;
}

function requireManagedMember(
  data: WorkspaceData,
  workspaceId: string,
  memberId: string,
  actor: AuthUserDto,
) {
  const { workspace, access } = requireManager(data, workspaceId, actor);
  const member = getProfiles(data, workspace, actor).find((item) => item.id === memberId);
  if (!member) throw new WorkspaceError('notFound');
  if (!canManageMember(access, actor.id, member)) throw new WorkspaceError('forbidden');
  return member;
}

export async function listWorkspaces(actor: AuthUserDto): Promise<WorkspaceSummary[]> {
  // TODO: Replace the mock with the generated workspace list endpoint when available.
  const data = readData(actor);
  return data.workspaces.flatMap((workspace) => {
    const access = getAccess(data, workspace, actor.id);
    return access ? [summarize(data, workspace, access)] : [];
  });
}

export async function getWorkspace(
  actor: AuthUserDto,
  id: string,
): Promise<WorkspaceSummary | null> {
  // TODO: Replace the mock with the generated workspace detail endpoint when available.
  const data = readData(actor);
  const workspace = data.workspaces.find((item) => item.id === id);
  const access = workspace && getAccess(data, workspace, actor.id);
  return workspace && access ? summarize(data, workspace, access) : null;
}

export async function createWorkspace(
  actor: AuthUserDto,
  input: WorkspaceInput,
): Promise<Workspace> {
  // TODO: Replace the mock with the generated workspace creation endpoint when available.
  const fields = workspaceFields.parse(input);
  const data = readData(actor);
  if (data.workspaces.some((workspace) => workspace.slug === fields.slug)) {
    throw new WorkspaceError('slugTaken');
  }
  const workspace = {
    ...fields,
    id: crypto.randomUUID(),
    ownerId: actor.id,
    createdAt: new Date().toISOString(),
  };
  data.workspaces.push(workspace);
  saveData(actor, data);
  return workspace;
}

export async function updateWorkspace(
  actor: AuthUserDto,
  id: string,
  input: WorkspaceInput,
): Promise<Workspace> {
  // TODO: Replace the mock with the generated workspace update endpoint when available.
  const fields = workspaceFields.parse(input);
  const data = readData(actor);
  const { workspace } = requireManager(data, id, actor);
  if (data.workspaces.some((item) => item.id !== id && item.slug === fields.slug)) {
    throw new WorkspaceError('slugTaken');
  }
  Object.assign(workspace, fields);
  saveData(actor, data);
  return workspace;
}

export async function deleteWorkspace(actor: AuthUserDto, id: string): Promise<void> {
  // TODO: Replace the mock with the generated workspace deletion endpoint when available.
  const data = readData(actor);
  if (requireAccess(data, id, actor).access !== 'owner') throw new WorkspaceError('forbidden');
  data.workspaces = data.workspaces.filter((item) => item.id !== id);
  data.members = data.members.filter((item) => item.workspaceId !== id);
  data.projects = data.projects.filter((item) => item.workspaceId !== id);
  data.invitations = data.invitations.filter((item) => item.workspaceId !== id);
  saveData(actor, data);
}

export async function listProjects(actor: AuthUserDto, id: string): Promise<Project[]> {
  // TODO: Replace the mock with the generated project list endpoint when available.
  const data = readData(actor);
  requireAccess(data, id, actor);
  return data.projects.filter((item) => item.workspaceId === id);
}

export async function addProject(
  actor: AuthUserDto,
  id: string,
  input: ProjectInput,
): Promise<Project> {
  // TODO: Replace the mock with the generated project creation endpoint when available.
  const fields = projectFields.parse(input);
  const data = readData(actor);
  requireManager(data, id, actor);
  const project = {
    ...fields,
    id: crypto.randomUUID(),
    workspaceId: id,
    teamId: null,
    description: fields.description || null,
    createdBy: actor.id,
    createdAt: new Date().toISOString(),
    updatedAt: null,
  };
  data.projects.push(project);
  saveData(actor, data);
  return project;
}

export async function removeProject(
  actor: AuthUserDto,
  id: string,
  projectId: string,
): Promise<void> {
  // TODO: Replace the mock with the generated project deletion endpoint when available.
  const data = readData(actor);
  requireManager(data, id, actor);
  const index = data.projects.findIndex((item) => item.id === projectId && item.workspaceId === id);
  if (index < 0) throw new WorkspaceError('notFound');
  data.projects.splice(index, 1);
  saveData(actor, data);
}

export async function listMembers(
  actor: AuthUserDto,
  id: string,
): Promise<{ members: MemberProfile[]; invitations: PendingInvitation[] }> {
  // TODO: Replace the mock with the generated member and invitation list endpoints when available.
  const data = readData(actor);
  const { workspace, access } = requireAccess(data, id, actor);
  return {
    members: getProfiles(data, workspace, actor),
    invitations: canManageWorkspace(access)
      ? data.invitations
          .filter((item) => item.workspaceId === id)
          .map(({ id, email, status }) => ({
            id,
            email,
            status,
          }))
      : [],
  };
}

export async function inviteMember(
  actor: AuthUserDto,
  id: string,
  address: string,
): Promise<PendingInvitation> {
  // TODO: Replace the mock with the generated invitation creation endpoint when available.
  const email = invitationEmail.parse(address);
  const data = readData(actor);
  const { workspace } = requireManager(data, id, actor);
  if (
    getProfiles(data, workspace, actor).some((member) => member.user.email.toLowerCase() === email)
  ) {
    throw new WorkspaceError('alreadyMember');
  }
  if (data.invitations.some((item) => item.workspaceId === id && item.email === email)) {
    throw new WorkspaceError('alreadyInvited');
  }
  const invitation = {
    id: crypto.randomUUID(),
    workspaceId: id,
    invitedBy: actor.id,
    email,
    status: 'pending',
    createdAt: new Date().toISOString(),
  } satisfies WorkspaceData['invitations'][number];
  data.invitations.push(invitation);
  saveData(actor, data);
  return { id: invitation.id, email, status: invitation.status };
}

export async function removeMember(
  actor: AuthUserDto,
  id: string,
  memberId: string,
): Promise<void> {
  // TODO: Replace the mock with the generated member removal endpoint when available.
  const data = readData(actor);
  requireManagedMember(data, id, memberId, actor);
  data.members = data.members.filter((item) => item.id !== memberId || item.workspaceId !== id);
  saveData(actor, data);
}

export async function changeMemberRole(
  actor: AuthUserDto,
  id: string,
  memberId: string,
  role: WorkspaceRole,
): Promise<void> {
  // TODO: Replace the mock with the generated member role endpoint when available.
  const data = readData(actor);
  requireManagedMember(data, id, memberId, actor);
  const member = data.members.find((item) => item.id === memberId && item.workspaceId === id);
  if (!member) throw new WorkspaceError('notFound');
  member.role = workspaceRole.parse(role);
  saveData(actor, data);
}
