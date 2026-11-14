'use client';

import { motion } from 'motion/react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { useI18n } from '@/shared/i18n';
import { EASE_OUT } from '@/shared/ui';

import { ProductMockup } from './product-mockup';

export function Hero() {
  const { t, locale } = useI18n();
  const words = t.hero.title.split(' ');

  return (
    <section className="relative overflow-hidden pb-8 sm:pb-12">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[40rem] bg-[radial-gradient(55%_60%_at_15%_0%,color-mix(in_oklch,var(--primary)_16%,transparent),transparent)]"
      />

      <div className="mx-auto max-w-6xl px-4 pt-14 sm:px-6 sm:pt-24">
        {/* key={locale}: при смене языка заголовок проигрывается заново */}
        <h1
          key={locale}
          className="max-w-4xl font-display text-4xl leading-[1.08] font-semibold tracking-tight text-balance sm:text-6xl lg:text-7xl"
        >
          <span className="sr-only">{t.hero.title}</span>
          <span aria-hidden="true">
            {words.map((word, index) => (
              <span key={index}>
                <span className="-mb-[0.15em] inline-block overflow-hidden pb-[0.15em] align-bottom">
                  <motion.span
                    className="inline-block"
                    initial={{ y: '115%' }}
                    animate={{ y: 0 }}
                    transition={{ duration: 0.75, delay: 0.05 + index * 0.07, ease: EASE_OUT }}
                  >
                    {word}
                  </motion.span>
                </span>{' '}
              </span>
            ))}
          </span>
        </h1>

        <motion.p
          className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.45, ease: EASE_OUT }}
        >
          {t.hero.subtitle}
        </motion.p>

        <motion.div
          className="mt-8 flex flex-wrap items-center gap-3"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.55, ease: EASE_OUT }}
        >
          <Button asChild size="lg" className="h-12 px-7 text-base">
            <Link href="/register">{t.hero.primary}</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="h-12 px-7 text-base">
            <Link href="/login">{t.hero.secondary}</Link>
          </Button>
        </motion.div>

        <ProductMockup className="mt-14 sm:mt-20" />
      </div>
    </section>
  );
}
