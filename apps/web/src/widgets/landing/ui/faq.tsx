'use client';

import { Plus } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';

import { useI18n } from '@/shared/i18n';
import { EASE_OUT, Reveal } from '@/shared/ui';

export function Faq() {
  const { t } = useI18n();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="scroll-mt-20 py-20 sm:py-28">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[1fr_2fr]">
        <Reveal>
          <h2 className="font-display text-3xl leading-tight font-semibold tracking-tight sm:text-4xl">
            {t.faq.title}
          </h2>
        </Reveal>

        <Reveal delay={0.1}>
          <ul className="border-t border-border">
            {t.faq.items.map((item, index) => {
              const isOpen = openIndex === index;
              const buttonId = `faq-button-${index}`;
              const panelId = `faq-panel-${index}`;

              return (
                <li key={index} className="border-b border-border">
                  <h3>
                    <button
                      type="button"
                      id={buttonId}
                      aria-expanded={isOpen}
                      aria-controls={panelId}
                      onClick={() => setOpenIndex(isOpen ? null : index)}
                      className="flex w-full items-center justify-between gap-6 rounded-sm py-5 text-left font-display text-lg font-medium transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                    >
                      {item.q}
                      <motion.span
                        aria-hidden="true"
                        className="shrink-0 text-primary"
                        animate={{ rotate: isOpen ? 45 : 0 }}
                        transition={{ duration: 0.3, ease: EASE_OUT }}
                      >
                        <Plus className="size-5" />
                      </motion.span>
                    </button>
                  </h3>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        id={panelId}
                        role="region"
                        aria-labelledby={buttonId}
                        className="overflow-hidden"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.35, ease: EASE_OUT }}
                      >
                        <p className="max-w-2xl pr-10 pb-6 leading-relaxed text-muted-foreground">
                          {item.a}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </li>
              );
            })}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
