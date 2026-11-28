'use client';

import type { AuthUserDto } from '@packages/api';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Folder, Plus, UserPlus } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { canManageMember, canManageWorkspace, type WorkspaceSummary } from '@/entities/workspace';
import { useSessionProfile } from '@/features/auth';
import {
  submitAction,
  WorkspaceDialog,
  type WorkspaceAction,
} from '@/features/workspace-management';
import { ROUTES } from '@/shared/config';
import { useI18n } from '@/shared/i18n';

import { workspaceKeys, workspaceQuery } from '../model/queries';
import { WorkspaceQueryState } from './workspace-query-state';

export function WorkspaceDetails({ id }: { id: string }) {
  const { data: actor } = useSessionProfile();
  return actor ? <WorkspaceDetailsContent key={`${actor.id}:${id}`} actor={actor} id={id} /> : null;
}

function WorkspaceDetailsContent({ actor, id }: { actor: AuthUserDto; id: string }) {
  const { t, locale } = useI18n();
  const copy = t.workspaces;
  const client = useQueryClient();
  const router = useRouter();
  const query = useQuery(workspaceQuery(actor, id));
  const [action, setAction] = useState<WorkspaceAction | null>(null);
  const membersTitle = useRef<HTMLHeadingElement>(null);
  const projectsTitle = useRef<HTMLHeadingElement>(null);
  const dateFormat = new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeZone: 'UTC' });

  async function onSaved(saved: WorkspaceAction) {
    if (saved.kind === 'deleteWorkspace') {
      client.setQueryData<WorkspaceSummary[]>(workspaceKeys.list(actor.id), (items) =>
        items?.filter((item) => item.id !== id),
      );
      await client.invalidateQueries({
        queryKey: workspaceKeys.all(actor.id),
        refetchType: 'none',
      });
      router.replace(ROUTES.PROFILE);
      return;
    }
    if (saved.kind === 'removeMember') membersTitle.current?.focus();
    if (saved.kind === 'removeProject') projectsTitle.current?.focus();
    await client.invalidateQueries({ queryKey: workspaceKeys.all(actor.id) });
  }

  const details = query.data;
  const manage = details ? canManageWorkspace(details.workspace.access) : false;

  return (
    <div className="mx-auto w-full max-w-4xl space-y-5">
      <Button asChild variant="ghost" size="sm">
        <Link href={ROUTES.PROFILE}>
          <ArrowLeft aria-hidden="true" className="size-4" />
          {copy.back}
        </Link>
      </Button>

      {query.isPending || query.isError ? (
        <WorkspaceQueryState error={query.isError} onRetry={() => void query.refetch()} />
      ) : !details ? (
        <h1 className="font-display text-2xl font-semibold">{copy.errors.notFound}</h1>
      ) : (
        <>
          <header className="space-y-4 rounded-xl border border-border bg-card p-5 text-card-foreground sm:p-6">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="min-w-0 wrap-break-word font-display text-3xl font-semibold tracking-tight">
                {details.workspace.name}
              </h1>
              <span className="rounded-md bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground">
                {copy.roles[details.workspace.access]}
              </span>
            </div>
            <p className="wrap-break-word text-sm text-muted-foreground">
              {details.workspace.slug}
            </p>
            {manage && (
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={() => setAction({ kind: 'editWorkspace', workspace: details.workspace })}
                >
                  {copy.edit}
                </Button>
                {details.workspace.access === 'owner' && (
                  <Button
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    onClick={() =>
                      setAction({ kind: 'deleteWorkspace', workspace: details.workspace })
                    }
                  >
                    {copy.actions.deleteWorkspace}
                  </Button>
                )}
              </div>
            )}
          </header>

          <section
            aria-labelledby="workspace-members"
            className="space-y-4 rounded-xl border border-border bg-card p-5 text-card-foreground sm:p-6"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2
                id="workspace-members"
                ref={membersTitle}
                tabIndex={-1}
                className="font-display text-xl font-semibold"
              >
                {copy.members}
              </h2>
              {manage && (
                <Button
                  variant="outline"
                  onClick={() => setAction({ kind: 'inviteMember', workspaceId: id })}
                >
                  <UserPlus aria-hidden="true" className="size-4" />
                  {copy.actions.inviteMember}
                </Button>
              )}
            </div>
            {details.members.length > 0 && (
              <ul className="divide-y divide-border">
                {details.members.map((member) => {
                  const { user } = member;
                  const canManage = canManageMember(details.workspace.access, actor.id, member);
                  return (
                    <li
                      key={member.id}
                      className="flex flex-wrap items-center justify-between gap-3 py-3"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        {user.avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element -- profile avatars may come from any provider
                          <img
                            src={user.avatarUrl}
                            width={40}
                            height={40}
                            alt=""
                            className="size-10 shrink-0 rounded-full bg-secondary object-cover"
                          />
                        ) : (
                          <span
                            aria-hidden="true"
                            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-secondary-foreground"
                          >
                            {Array.from(user.username)[0]?.toLocaleUpperCase(locale)}
                          </span>
                        )}
                        <div className="min-w-0">
                          <p className="wrap-break-word font-medium">{user.username}</p>
                          <p className="wrap-break-word text-sm text-muted-foreground">
                            {user.email}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-md bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground">
                          {copy.roles[member.access]}
                        </span>
                        {canManage && (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                setAction({
                                  kind: 'changeRole',
                                  workspaceId: id,
                                  memberId: member.id,
                                  name: user.username,
                                  role: member.access === 'admin' ? 'admin' : 'member',
                                })
                              }
                            >
                              {copy.actions.changeRole}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive hover:text-destructive"
                              onClick={() =>
                                setAction({
                                  kind: 'removeMember',
                                  workspaceId: id,
                                  memberId: member.id,
                                  name: user.username,
                                })
                              }
                            >
                              {copy.actions.removeMember}
                            </Button>
                          </>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
            {details.members.every((member) => member.access === 'owner') && (
              <p className="text-sm text-muted-foreground">{copy.noMembers}</p>
            )}
            {details.invitations.length > 0 && (
              <div className="space-y-3 border-t border-border pt-4">
                <h3 className="font-medium">{copy.invitations}</h3>
                <ul className="space-y-2 text-sm">
                  {details.invitations.map(({ id, email }) => (
                    <li key={id} className="flex flex-wrap items-center justify-between gap-2">
                      <span className="min-w-0 wrap-break-word">{email}</span>
                      <span className="text-muted-foreground">{copy.pending}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          <section
            aria-labelledby="workspace-projects"
            className="space-y-4 rounded-xl border border-border bg-card p-5 text-card-foreground sm:p-6"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2
                id="workspace-projects"
                ref={projectsTitle}
                tabIndex={-1}
                className="font-display text-xl font-semibold"
              >
                {copy.projects}
              </h2>
              {manage && (
                <Button
                  variant="outline"
                  onClick={() => setAction({ kind: 'addProject', workspaceId: id })}
                >
                  <Plus aria-hidden="true" className="size-4" />
                  {copy.actions.addProject}
                </Button>
              )}
            </div>
            {details.projects.length === 0 ? (
              <p className="text-sm text-muted-foreground">{copy.noProjects}</p>
            ) : (
              <ul className="divide-y divide-border">
                {details.projects.map((project) => (
                  <li
                    key={project.id}
                    className="flex flex-wrap items-center justify-between gap-3 py-3"
                  >
                    <div className="flex min-w-0 gap-3">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
                        <Folder aria-hidden="true" className="size-5" />
                      </span>
                      <div className="min-w-0 space-y-0.5">
                        <h3 className="wrap-break-word font-medium">{project.name}</h3>
                        {project.description && (
                          <p className="wrap-break-word whitespace-pre-line text-sm text-muted-foreground">
                            {project.description}
                          </p>
                        )}
                        {project.createdAt && (
                          <time
                            dateTime={project.createdAt}
                            className="block text-sm text-muted-foreground"
                          >
                            {copy.createdAt(dateFormat.format(new Date(project.createdAt)))}
                          </time>
                        )}
                      </div>
                    </div>
                    {manage && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setAction({ kind: 'removeProject', project })}
                      >
                        {copy.actions.removeProject}
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
      {action && (
        <WorkspaceDialog
          action={action}
          onSubmit={(values) => submitAction(actor, action, values)}
          onClose={() => setAction(null)}
          onSaved={onSaved}
        />
      )}
    </div>
  );
}
