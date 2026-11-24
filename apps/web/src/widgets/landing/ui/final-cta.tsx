'use client';

import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { ROUTES } from '@/shared/config';
import { useI18n } from '@/shared/i18n';
import { Reveal } from '@/shared/ui';

export function FinalCta() {
  const { t } = useI18n();

  return (
    <section className="border-t border-border py-20 sm:py-28">
      <Reveal className="mx-auto flex max-w-6xl flex-col items-start gap-8 px-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
        <h2 className="max-w-xl font-display text-3xl leading-tight font-semibold tracking-tight text-balance sm:text-5xl">
          {t.cta.title}
        </h2>
        <div className="flex flex-wrap items-center gap-3">
          <Button asChild size="lg" className="h-12 px-7 text-base">
            <Link href={ROUTES.REGISTER}>{t.cta.primary}</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="h-12 px-7 text-base">
            <Link href={ROUTES.LOGIN}>{t.cta.secondary}</Link>
          </Button>
        </div>
      </Reveal>
    </section>
  );
}
