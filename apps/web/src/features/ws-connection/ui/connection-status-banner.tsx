'use client';

import { AlertCircle, Loader2, RefreshCw, WifiOff } from 'lucide-react';

import { cn } from '@/shared/lib';

import { useSocketConnection } from '../model/use-socket-connection';
import { useSocketError, useSocketStatus, useSocketStore } from '../model/use-socket-store';

export interface ConnectionStatusBannerProps {
  className?: string;
  autoConnect?: boolean;
}

export function ConnectionStatusBanner({
  className,
  autoConnect = false,
}: ConnectionStatusBannerProps) {
  const { connect } = useSocketConnection({ autoConnect });
  const status = useSocketStatus();
  const lastError = useSocketError();

  const handleRetry = () => {
    useSocketStore.getState().setStatus('connecting');
    connect();
  };

  if (status === 'connected') {
    return null;
  }

  if (status === 'connecting') {
    return (
      <div
        role="status"
        aria-live="polite"
        className={cn(
          'flex items-center justify-center gap-2 border-b bg-muted/60 px-4 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur-sm transition-colors',
          className,
        )}
      >
        <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
        <span>Подключение к серверу...</span>
      </div>
    );
  }

  if (status === 'reconnecting') {
    return (
      <div
        role="status"
        aria-live="polite"
        className={cn(
          'flex items-center justify-center gap-2 border-b border-amber-500/20 bg-amber-500/10 px-4 py-1.5 text-xs font-medium text-amber-700 backdrop-blur-sm dark:text-amber-400 transition-colors',
          className,
        )}
      >
        <RefreshCw className="size-3.5 animate-spin" aria-hidden="true" />
        <span>Потеряна связь. Восстановление соединения...</span>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div
        role="alert"
        aria-live="assertive"
        className={cn(
          'flex items-center justify-between gap-3 border-b border-destructive/20 bg-destructive/10 px-4 py-1.5 text-xs font-medium text-destructive backdrop-blur-sm transition-colors',
          className,
        )}
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <AlertCircle className="size-3.5 shrink-0" aria-hidden="true" />
          <span className="truncate">{lastError || 'Не удалось подключиться к серверу.'}</span>
        </div>
        <button
          type="button"
          onClick={handleRetry}
          className="inline-flex shrink-0 items-center gap-1 rounded bg-destructive/20 px-2 py-0.5 text-xs font-semibold hover:bg-destructive/30 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring transition-colors"
        >
          <RefreshCw className="size-3" aria-hidden="true" />
          <span>Повторить</span>
        </button>
      </div>
    );
  }

  // status === 'disconnected'
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'flex items-center justify-between gap-3 border-b border-border bg-muted px-4 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur-sm transition-colors',
        className,
      )}
    >
      <div className="flex items-center gap-2">
        <WifiOff className="size-3.5 shrink-0" aria-hidden="true" />
        <span>Нет соединения с сервером</span>
      </div>
      <button
        type="button"
        onClick={handleRetry}
        className="inline-flex shrink-0 items-center gap-1 rounded bg-secondary px-2 py-0.5 text-xs font-semibold text-secondary-foreground hover:bg-secondary/80 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring transition-colors"
      >
        <span>Подключить</span>
      </button>
    </div>
  );
}
