import { Button } from '@/components/ui/button';
import { useI18n } from '@/shared/i18n';

export function WorkspaceQueryState({ error, onRetry }: { error: boolean; onRetry: () => void }) {
  const { t } = useI18n();

  if (error) {
    return (
      <div className="space-y-3 rounded-xl border border-border bg-card p-5">
        <p role="alert" className="text-sm text-destructive">
          {t.workspaces.errors.load}
        </p>
        <Button variant="outline" onClick={onRetry}>
          {t.auth.retry}
        </Button>
      </div>
    );
  }

  return (
    <div role="status" className="space-y-3 rounded-xl border border-border bg-card p-5">
      <span className="sr-only">{t.workspaces.loading}</span>
      <div
        aria-hidden="true"
        className="h-5 w-1/2 animate-pulse rounded bg-muted motion-reduce:animate-none"
      />
      <div
        aria-hidden="true"
        className="h-4 w-3/4 animate-pulse rounded bg-muted motion-reduce:animate-none"
      />
    </div>
  );
}
