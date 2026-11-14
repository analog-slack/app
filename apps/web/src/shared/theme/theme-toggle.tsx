'use client';

import { Moon, Sun } from 'lucide-react';

import { useI18n } from '@/shared/i18n';
import { cn } from '@/shared/lib';

import { THEME_STORAGE_KEY } from './theme-script';

export function ThemeToggle({ className }: { className?: string }) {
  const { t } = useI18n();

  const toggle = () => {
    const isDark = document.documentElement.classList.toggle('dark');
    try {
      localStorage.setItem(THEME_STORAGE_KEY, isDark ? 'dark' : 'light');
    } catch {
      // localStorage недоступен: тема просто не запомнится
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={t.header.toggleTheme}
      className={cn(
        'inline-flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
        className,
      )}
    >
      <Moon className="size-4 dark:hidden" aria-hidden="true" />
      <Sun className="hidden size-4 dark:block" aria-hidden="true" />
    </button>
  );
}
