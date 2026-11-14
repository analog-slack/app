'use client';

import { MessageSquare, MessagesSquare, SquareKanban } from 'lucide-react';

import { useI18n } from '@/shared/i18n';
import { Reveal } from '@/shared/ui';

export function Features() {
  const { t } = useI18n();
  const f = t.features;

  return (
    <section id="features" className="scroll-mt-20 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal>
          <h2 className="max-w-2xl font-display text-3xl leading-tight font-semibold tracking-tight text-balance sm:text-4xl">
            {f.title}
          </h2>
        </Reveal>

        <div className="mt-12 grid gap-4 lg:grid-cols-5 lg:grid-rows-2">
          <Reveal className="lg:col-span-3 lg:row-span-2">
            <article className="flex h-full flex-col justify-between gap-12 rounded-3xl bg-primary p-8 text-primary-foreground sm:p-10">
              <div>
                <MessagesSquare className="size-8" aria-hidden="true" />
                <h3 className="mt-6 font-display text-2xl font-semibold sm:text-3xl">
                  {f.taskChat.title}
                </h3>
                <p className="mt-3 max-w-md leading-relaxed text-primary-foreground/85">
                  {f.taskChat.text}
                </p>
              </div>
              <div aria-hidden="true" className="flex max-w-sm flex-col gap-2 text-sm">
                <span className="self-start rounded-2xl rounded-bl-sm bg-primary-foreground/15 px-4 py-2.5">
                  {f.taskChat.sample}
                </span>
                <span className="self-end rounded-2xl rounded-br-sm bg-primary-foreground px-4 py-2.5 font-medium text-primary">
                  {f.taskChat.reply}
                </span>
              </div>
            </article>
          </Reveal>

          <Reveal className="lg:col-span-2" delay={0.1}>
            <article className="h-full rounded-3xl border border-border bg-card p-8">
              <SquareKanban className="size-7 text-primary" aria-hidden="true" />
              <h3 className="mt-5 font-display text-xl font-semibold">{f.board.title}</h3>
              <p className="mt-2 leading-relaxed text-muted-foreground">{f.board.text}</p>
            </article>
          </Reveal>

          <Reveal className="lg:col-span-2" delay={0.2}>
            <article className="h-full rounded-3xl border border-border bg-card p-8">
              <MessageSquare className="size-7 text-primary" aria-hidden="true" />
              <h3 className="mt-5 font-display text-xl font-semibold">{f.messenger.title}</h3>
              <p className="mt-2 leading-relaxed text-muted-foreground">{f.messenger.text}</p>
            </article>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
