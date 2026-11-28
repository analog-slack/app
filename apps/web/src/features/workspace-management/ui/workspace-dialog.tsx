'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { LoaderCircle } from 'lucide-react';
import { type SubmitEvent, useEffect, useId, useRef } from 'react';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { WorkspaceError } from '@/entities/workspace';
import { useI18n } from '@/shared/i18n';
import { TextField } from '@/shared/ui';

import {
  createActionSchema,
  getActionTarget,
  isDestructive,
  type ActionValues,
  type WorkspaceAction,
} from '../model/actions';

export function WorkspaceDialog({
  action,
  onSubmit,
  onClose,
  onSaved,
}: {
  action: WorkspaceAction;
  onSubmit: (values: ActionValues) => Promise<unknown>;
  onClose: () => void;
  onSaved: (action: WorkspaceAction) => void | Promise<void>;
}) {
  const { t } = useI18n();
  const copy = t.workspaces;
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLElement>(null);
  const workspaceForm = action.kind === 'createWorkspace' || action.kind === 'editWorkspace';
  const destructive = isDestructive(action);
  const target = getActionTarget(action);
  const editing = action.kind === 'editWorkspace' ? action.workspace : undefined;
  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(createActionSchema(action, copy)),
    defaultValues: {
      name: editing?.name ?? '',
      slug: editing?.slug ?? '',
      description: '',
      email: '',
      role: action.kind === 'changeRole' ? action.role : 'member',
    },
  });

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const trigger = document.activeElement;
    triggerRef.current = trigger instanceof HTMLElement ? trigger : null;
    dialog.showModal();
    if (destructive) {
      cancelRef.current?.focus();
    } else {
      dialog.querySelector<HTMLElement>('input, select')?.focus();
    }
    return () => {
      if (dialog.open) {
        dialog.close();
        if (trigger instanceof HTMLElement && trigger.isConnected) trigger.focus();
      }
    };
  }, [destructive]);

  function closeDialog() {
    dialogRef.current?.close();
    if (triggerRef.current?.isConnected) triggerRef.current.focus();
    onClose();
  }

  function save(event: SubmitEvent<HTMLFormElement>) {
    void handleSubmit(async (values) => {
      clearErrors('root');
      try {
        await onSubmit(values);
      } catch (error) {
        const message =
          error instanceof WorkspaceError ? copy.errors[error.code] : copy.errors.save;
        if (error instanceof WorkspaceError && error.code === 'slugTaken') {
          setError('slug', { message }, { shouldFocus: true });
        } else if (
          action.kind === 'inviteMember' &&
          error instanceof WorkspaceError &&
          (error.code === 'alreadyMember' || error.code === 'alreadyInvited')
        ) {
          setError('email', { message }, { shouldFocus: true });
        } else {
          setError('root', { message });
        }
        return;
      }
      closeDialog();
      await onSaved(action);
    })(event);
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={target ? descriptionId : undefined}
      className="fixed inset-0 m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-xl border border-border bg-card p-5 text-card-foreground shadow-xl backdrop:bg-foreground/40 sm:p-6"
      onCancel={(event) => {
        event.preventDefault();
        if (!isSubmitting) closeDialog();
      }}
    >
      <h2 id={titleId} className="font-display text-xl font-semibold tracking-tight">
        {copy.actions[action.kind]}
      </h2>
      {target && (
        <p id={descriptionId} className="mt-2 wrap-break-word text-sm text-muted-foreground">
          {destructive ? copy.confirm[action.kind](target) : target}
        </p>
      )}
      <form aria-busy={isSubmitting} noValidate onSubmit={save} className="mt-5 space-y-4">
        {(workspaceForm || action.kind === 'addProject') && (
          <TextField
            label={copy.fields.name}
            error={errors.name?.message}
            maxLength={150}
            required
            {...register('name')}
          />
        )}
        {workspaceForm && (
          <TextField
            label={copy.fields.slug}
            error={errors.slug?.message}
            maxLength={150}
            autoCapitalize="none"
            spellCheck={false}
            required
            {...register('slug')}
          />
        )}
        {action.kind === 'addProject' && (
          <label className="block space-y-1.5 text-sm font-medium">
            <span>{copy.fields.description}</span>
            <textarea
              rows={3}
              className="block w-full rounded-md border border-input bg-card px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
              {...register('description')}
            />
          </label>
        )}
        {action.kind === 'inviteMember' && (
          <TextField
            label={copy.fields.email}
            error={errors.email?.message}
            type="email"
            maxLength={255}
            required
            {...register('email')}
          />
        )}
        {action.kind === 'changeRole' && (
          <label className="block space-y-1.5 text-sm font-medium">
            <span>{copy.fields.role}</span>
            <select
              className="block h-11 w-full rounded-md border border-input bg-card px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
              {...register('role')}
            >
              <option value="admin">{copy.roles.admin}</option>
              <option value="member">{copy.roles.member}</option>
            </select>
          </label>
        )}
        {errors.root?.message && (
          <p role="alert" className="text-sm text-destructive">
            {errors.root.message}
          </p>
        )}
        <div className="flex flex-wrap justify-end gap-2">
          <Button
            ref={cancelRef}
            type="button"
            variant="outline"
            onClick={closeDialog}
            disabled={isSubmitting}
          >
            {copy.cancel}
          </Button>
          <Button
            type="submit"
            variant={destructive ? 'destructive' : 'default'}
            disabled={isSubmitting}
          >
            {isSubmitting && <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />}
            {destructive
              ? copy.delete
              : action.kind === 'inviteMember'
                ? copy.actions.inviteMember
                : copy.save}
          </Button>
        </div>
      </form>
    </dialog>
  );
}
