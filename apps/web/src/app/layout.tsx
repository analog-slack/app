import './globals.css';

import type { Metadata } from 'next';
import { Geologica, Golos_Text } from 'next/font/google';
import type { ReactNode } from 'react';

import { dictionaries } from '@/shared/i18n';
import { getLocale } from '@/shared/i18n/get-locale';
import { ThemeScript } from '@/shared/theme';

import { Providers } from './providers';

const display = Geologica({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-geologica',
  display: 'swap',
});

const sans = Golos_Text({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-golos',
  display: 'swap',
});

export async function generateMetadata(): Promise<Metadata> {
  const { meta } = dictionaries[await getLocale()];
  return { title: meta.title, description: meta.description };
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const locale = await getLocale();

  return (
    <html lang={locale} className={`${display.variable} ${sans.variable}`} suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body>
        <Providers locale={locale}>{children}</Providers>
      </body>
    </html>
  );
}
