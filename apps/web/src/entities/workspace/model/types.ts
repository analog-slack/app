import { z } from 'zod';

export const workspaceFields = z.object({
  name: z.string().trim().min(1).max(150),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(150)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
});

export const projectFields = workspaceFields.pick({ name: true }).extend({
  description: z.string().trim(),
});

export const workspaceRole = z.enum(['admin', 'member']);
export const invitationEmail = z.string().trim().max(255).email().toLowerCase();

const nullableDate = z.iso.datetime().nullable();
const user = z.object({
  id: z.uuid(),
  username: z.string(),
  email: z.email(),
  avatarUrl: z.string().nullable(),
});

const workspace = workspaceFields.extend({
  id: z.uuid(),
  ownerId: z.uuid(),
  createdAt: nullableDate,
});

const member = z.object({
  id: z.uuid(),
  workspaceId: z.uuid(),
  userId: z.uuid(),
  role: workspaceRole.nullable(),
  joinedAt: nullableDate,
});

const project = projectFields.extend({
  id: z.uuid(),
  workspaceId: z.uuid(),
  teamId: z.uuid().nullable(),
  description: z.string().nullable(),
  createdBy: z.uuid(),
  createdAt: nullableDate,
  updatedAt: nullableDate,
});

const invitation = z.object({
  id: z.uuid(),
  workspaceId: z.uuid(),
  invitedBy: z.uuid(),
  email: z.email(),
  status: z.literal('pending'),
  createdAt: nullableDate,
});

export const workspaceData = z.object({
  users: z.array(user),
  workspaces: z.array(workspace),
  projects: z.array(project),
  members: z.array(member),
  invitations: z.array(invitation),
});

export type WorkspaceData = z.infer<typeof workspaceData>;
export type Workspace = z.infer<typeof workspace>;
export type Project = z.infer<typeof project>;
export type WorkspaceMember = z.infer<typeof member>;
export type WorkspaceInvitation = z.infer<typeof invitation>;
export type WorkspaceRole = z.infer<typeof workspaceRole>;
export type WorkspaceAccess = WorkspaceRole | 'owner';
export type WorkspaceInput = z.input<typeof workspaceFields>;
export type ProjectInput = z.input<typeof projectFields>;

export interface WorkspaceSummary extends Workspace {
  access: WorkspaceAccess;
  memberCount: number;
  projectCount: number;
}

export type MemberProfile = Pick<WorkspaceMember, 'id' | 'userId'> & {
  user: Pick<z.infer<typeof user>, 'username' | 'email' | 'avatarUrl'>;
  access: WorkspaceAccess;
};

export type PendingInvitation = Pick<WorkspaceInvitation, 'id' | 'email' | 'status'>;
