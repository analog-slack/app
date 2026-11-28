import type { MemberProfile, WorkspaceAccess } from './types';

export function canManageWorkspace(access: WorkspaceAccess) {
  return access === 'owner' || access === 'admin';
}

export function canManageMember(access: WorkspaceAccess, actorId: string, member: MemberProfile) {
  return canManageWorkspace(access) && member.access !== 'owner' && member.userId !== actorId;
}
