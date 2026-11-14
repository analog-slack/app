'use client';

import { motion } from 'motion/react';

import { useI18n } from '@/shared/i18n';
import { EASE_OUT, Reveal } from '@/shared/ui';

export function HowItWorks() {
  const { t } = useI18n();

  return (
    <section id="how" className="scroll-mt-16 border-y border-border bg-muted/40 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal>
          <h2 className="max-w-2xl font-display text-3xl leading-tight font-semibold tracking-tight text-balance sm:text-4xl">
            {t.how.title}
          </h2>
        </Reveal>

        {/* Запуск анимации по контейнеру: у самой линии в начале нулевая ширина, и браузер не считает её видимой */}
        <motion.div
          className="relative mt-14"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-120px' }}
        >
          <motion.div
            aria-hidden="true"
            className="absolute top-5 right-0 left-0 hidden h-px origin-left bg-primary/40 lg:block"
            variants={{ hidden: { scaleX: 0 }, visible: { scaleX: 1 } }}
            transition={{ duration: 1.4, ease: EASE_OUT }}
          />
          <ol className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
            {t.how.steps.map((step, index) => (
              <motion.li
                key={index}
                variants={{ hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0 } }}
                transition={{ duration: 0.6, delay: 0.15 + index * 0.2, ease: EASE_OUT }}
              >
                <span
                  aria-hidden="true"
                  className="relative flex size-10 items-center justify-center rounded-full bg-primary font-display text-sm font-semibold text-primary-foreground"
                >
                  {index + 1}
                </span>
                <h3 className="mt-5 font-display text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.text}</p>
              </motion.li>
            ))}
          </ol>
        </motion.div>
      </div>
    </section>
  );
}
