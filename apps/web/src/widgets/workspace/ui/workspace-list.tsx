'use client';

import type { AuthUserDto } from '@packages/api';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowUpRight, Boxes, Plus, Users } from 'lucide-react';
import Link from 'next/link';
import { useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { canManageWorkspace } from '@/entities/workspace';
import { useSessionProfile } from '@/features/auth';
import {
  submitAction,
  WorkspaceDialog,
  type WorkspaceAction,
} from '@/features/workspace-management';
import { ROUTES } from '@/shared/config';
import { useI18n } from '@/shared/i18n';
import { TextField } from '@/shared/ui';

import { workspaceKeys, workspacesQuery } from '../model/queries';
import { WorkspaceQueryState } from './workspace-query-state';

export function WorkspaceList() {
  const { data: actor } = useSessionProfile();
  return actor ? <WorkspaceListContent key={actor.id} actor={actor} /> : null;
}

function WorkspaceListContent({ actor }: { actor: AuthUserDto }) {
  const { t, locale } = useI18n();
  const copy = t.workspaces;
  const client = useQueryClient();
  const query = useQuery(workspacesQuery(actor));
  const titleRef = useRef<HTMLHeadingElement>(null);
  const [action, setAction] = useState<WorkspaceAction | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('newest');
  const needle = search.trim().toLocaleLowerCase(locale);
  const workspaces = query.data
    ?.filter((workspace) => {
      const matchesSearch = [workspace.name, workspace.slug].some((text) =>
        text.toLocaleLowerCase(locale).includes(needle),
      );
      const matchesRole =
        filter === 'all' ||
        (filter === 'owned' ? workspace.access === 'owner' : workspace.access !== 'owner');
      return matchesSearch && matchesRole;
    })
    .sort((a, b) => {
      if (!a.createdAt) return b.createdAt ? 1 : a.name.localeCompare(b.name, locale);
      if (!b.createdAt) return -1;
      const dates = a.createdAt.localeCompare(b.createdAt);
      return (sort === 'oldest' ? dates : -dates) || a.name.localeCompare(b.name, locale);
    });

  async function onSaved(saved: WorkspaceAction) {
    if (saved.kind === 'deleteWorkspace') titleRef.current?.focus();
    await client.invalidateQueries({ queryKey: workspaceKeys.all(actor.id) });
  }

  const selectClass =
    'block h-11 w-full rounded-md border border-input bg-card px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30';

  return (
    <section aria-labelledby="workspaces-title" className="min-w-0 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2
          id="workspaces-title"
          ref={titleRef}
          tabIndex={-1}
          className="font-display text-2xl font-semibold tracking-tight"
        >
          {copy.title}
        </h2>
        {query.data && query.data.length > 0 && (
          <Button onClick={() => setAction({ kind: 'createWorkspace' })}>
            <Plus aria-hidden="true" className="size-4" />
            {copy.actions.createWorkspace}
          </Button>
        )}
      </div>

      {query.isPending || query.isError ? (
        <WorkspaceQueryState error={query.isError} onRetry={() => void query.refetch()} />
      ) : query.data.length === 0 ? (
        <div className="space-y-4 rounded-xl border border-dashed border-border bg-card px-5 py-10 text-center">
          <p className="text-muted-foreground">{copy.empty}</p>
          <Button onClick={() => setAction({ kind: 'createWorkspace' })}>{copy.createFirst}</Button>
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)]">
            <TextField
              label={copy.search}
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <label className="space-y-1.5 text-sm font-medium">
              <span>{copy.accessFilter}</span>
              <select
                className={selectClass}
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
              >
                <option value="all">{copy.filters.all}</option>
                <option value="owned">{copy.filters.owned}</option>
                <option value="joined">{copy.filters.joined}</option>
              </select>
            </label>
            <label className="space-y-1.5 text-sm font-medium">
              <span>{copy.sort}</span>
              <select
                className={selectClass}
                value={sort}
                onChange={(event) => setSort(event.target.value)}
              >
                <option value="newest">{copy.sorts.newest}</option>
                <option value="oldest">{copy.sorts.oldest}</option>
              </select>
            </label>
          </div>
          {workspaces?.length === 0 ? (
            <p
              role="status"
              className="rounded-xl border border-dashed border-border bg-card p-6 text-center text-muted-foreground"
            >
              {copy.noResults}
            </p>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {workspaces?.map((workspace) => (
                <li
                  key={workspace.id}
                  className="flex min-w-0 flex-col justify-between gap-4 rounded-xl border border-border bg-card p-4 text-card-foreground sm:p-5"
                >
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="wrap-break-word font-display text-lg font-semibold">
                          {workspace.name}
                        </h3>
                        <p className="wrap-break-word text-sm text-muted-foreground">
                          {workspace.slug}
                        </p>
                      </div>
                      <span className="rounded-md bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground">
                        {copy.roles[workspace.access]}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5">
                        <Users aria-hidden="true" className="size-4" />
                        {copy.counts.members(workspace.memberCount)}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Boxes aria-hidden="true" className="size-4" />
                        {copy.counts.projects(workspace.projectCount)}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 border-t border-border pt-3">
                    <Button asChild size="sm" variant="outline">
                      <Link href={ROUTES.WORKSPACE(workspace.id)}>
                        {copy.open}
                        <ArrowUpRight aria-hidden="true" className="size-3.5" />
                      </Link>
                    </Button>
                    {canManageWorkspace(workspace.access) && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setAction({ kind: 'editWorkspace', workspace })}
                      >
                        {copy.edit}
                      </Button>
                    )}
                    {workspace.access === 'owner' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setAction({ kind: 'deleteWorkspace', workspace })}
                      >
                        {copy.delete}
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
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
    </section>
  );
}
