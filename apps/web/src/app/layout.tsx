import './globals.css';

import type { ReactNode } from 'react';

import { ConnectionStatusBanner } from '@/features/ws-connection';

import { Providers } from './providers';

export const metadata = { title: 'Analog Slack' };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body>
        <Providers>
          <ConnectionStatusBanner />
          {children}
        </Providers>
      </body>
    </html>
  );
}
