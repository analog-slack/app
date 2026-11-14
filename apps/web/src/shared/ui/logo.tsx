import Link from 'next/link';

import { APP_NAME } from '@/shared/config';
import { cn } from '@/lib';

export function Logo({ label, className }: { label: string; className?: string }) {
  return (
    <Link
      href="/"
      aria-label={`${APP_NAME}. ${label}`}
      className={cn(
        'inline-flex items-center gap-2 rounded-md font-display text-lg font-semibold tracking-tight focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring',
        className,
      )}
    >
      <svg viewBox="0 0 28 28" className="size-7 text-primary" aria-hidden="true">
        <rect width="28" height="28" rx="8" fill="currentColor" />
        <path d="M8 8.5h12v8.5h-6.5L10 20.5V17H8z" className="fill-primary-foreground" />
      </svg>
      <span className="hidden sm:inline">{APP_NAME}</span>
    </Link>
  );
}
