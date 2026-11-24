'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MotionConfig } from 'motion/react';
import { type ReactNode, useState } from 'react';

import { configureApiTransport } from '@/shared/api';
import { I18nProvider, type Locale } from '@/shared/i18n';

configureApiTransport();

export function Providers({ locale, children }: { locale: Locale; children: ReactNode }) {
  const [client] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={client}>
      <I18nProvider initialLocale={locale}>
        {/* reducedMotion="user": при системной настройке «меньше движения» остаются только проявления */}
        <MotionConfig reducedMotion="user">{children}</MotionConfig>
      </I18nProvider>
    </QueryClientProvider>
  );
}
