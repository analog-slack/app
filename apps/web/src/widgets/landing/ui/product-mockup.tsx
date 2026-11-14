'use client';

import { MessagesSquare, Send } from 'lucide-react';
import { motion } from 'motion/react';
import { type ReactNode, useEffect, useState } from 'react';

import { type Dictionary, useI18n } from '@/shared/i18n';
import { cn } from '@/shared/lib';
import { EASE_OUT } from '@/shared/ui';

type CardId = keyof Dictionary['mockup']['cards'];
type Tag = keyof Dictionary['mockup']['tags'];
type Person = 'marina' | 'igor';

interface CardData {
  id: CardId;
  tag: Tag;
  people: Person[];
}

const TODO: CardData[] = [
  { id: 'feedback', tag: 'research', people: ['igor'] },
  { id: 'notifications', tag: 'backend', people: ['marina'] },
];
const ACTIVE: CardData = { id: 'landing', tag: 'design', people: ['marina', 'igor'] };
const DOING: CardData[] = [{ id: 'csv', tag: 'backend', people: ['igor'] }];
const DONE: CardData[] = [{ id: 'auth', tag: 'backend', people: ['marina'] }];

const TAG_STYLE: Record<Tag, string> = {
  design: 'bg-primary/10 text-primary',
  backend: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
  research: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
};

const PERSON_STYLE: Record<Person, string> = {
  marina: 'bg-primary text-primary-foreground',
  igor: 'bg-amber-400 text-amber-950',
};

/** Сценарий анимации: секунды от загрузки страницы. */
const AT = {
  board: 0.6,
  cards: 1,
  focus: 2,
  chat: 2.2,
  first: 2.9,
  invited: 3.8,
  second: 4.6,
  third: 5.7,
  move: 6.8,
};

const LAYOUT_SPRING = { type: 'spring', stiffness: 200, damping: 26 } as const;

function Avatar({ person, className }: { person: Person; className?: string }) {
  const { t } = useI18n();
  return (
    <span
      className={cn(
        'inline-flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ring-2 ring-card',
        PERSON_STYLE[person],
        className,
      )}
    >
      {t.mockup.chat[person].charAt(0)}
    </span>
  );
}

function TaskCard({
  card,
  delay,
  active = false,
  enter = true,
}: {
  card: CardData;
  delay: number;
  active?: boolean;
  /** false для карточки, которая переехала из другой колонки: без повторного появления */
  enter?: boolean;
}) {
  const { t } = useI18n();

  return (
    <motion.li
      layout
      layoutId={`mockup-card-${card.id}`}
      initial={enter ? { opacity: 0, y: 14 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: EASE_OUT, layout: LAYOUT_SPRING }}
      className="relative rounded-lg border border-border bg-card p-3 shadow-sm"
    >
      {active && (
        <motion.span
          className="pointer-events-none absolute -inset-px rounded-lg ring-2 ring-primary"
          initial={enter ? { opacity: 0 } : false}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: AT.focus }}
        />
      )}
      <span
        className={cn(
          'inline-block rounded-full px-2 py-0.5 text-[11px] font-medium',
          TAG_STYLE[card.tag],
        )}
      >
        {t.mockup.tags[card.tag]}
      </span>
      <p className="mt-2 text-[13px] leading-snug font-medium">{t.mockup.cards[card.id]}</p>
      <div className="mt-3 flex items-center justify-between">
        <span className="flex -space-x-1.5">
          {card.people.map((person) => (
            <Avatar key={person} person={person} className="size-5 text-[10px]" />
          ))}
        </span>
        {active && (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-primary">
            <MessagesSquare className="size-3.5" />3
          </span>
        )}
      </div>
    </motion.li>
  );
}

function Column({
  title,
  count,
  className,
  children,
}: {
  title: string;
  count: number;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn('min-w-0', className)}>
      <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-muted-foreground">
        <span className="truncate">{title}</span>
        <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] tabular-nums">
          {count}
        </span>
      </div>
      <ul className="space-y-2.5">{children}</ul>
    </div>
  );
}

function Message({
  person,
  text,
  delay,
  mine = false,
}: {
  person: Person;
  text: string;
  delay: number;
  mine?: boolean;
}) {
  const { t } = useI18n();

  return (
    <motion.li
      className={cn('flex items-end gap-2', mine && 'flex-row-reverse')}
      style={{ transformOrigin: mine ? 'bottom right' : 'bottom left' }}
      initial={{ opacity: 0, y: 12, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 320, damping: 24, delay }}
    >
      <Avatar person={person} />
      <div
        className={cn(
          'max-w-[80%] rounded-2xl px-3 py-2 text-[13px] leading-snug',
          mine
            ? 'rounded-br-sm bg-primary text-primary-foreground'
            : 'rounded-bl-sm bg-muted text-foreground',
        )}
      >
        <span className="sr-only">{t.mockup.chat[person]}: </span>
        {text}
      </div>
    </motion.li>
  );
}

function SystemLine({ text, visible, delay }: { text: string; visible: boolean; delay: number }) {
  return (
    <motion.li
      className="text-center text-[11px] text-muted-foreground"
      initial={{ opacity: 0 }}
      animate={{ opacity: visible ? 1 : 0 }}
      transition={{ duration: 0.4, delay }}
    >
      {text}
    </motion.li>
  );
}

export function ProductMockup({ className }: { className?: string }) {
  const { t } = useI18n();
  const m = t.mockup;
  const [moved, setMoved] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMoved(true), AT.move * 1000);
    return () => clearTimeout(timer);
  }, []);

  const doing = moved ? DOING : [ACTIVE, ...DOING];
  const done = moved ? [ACTIVE, ...DONE] : DONE;

  return (
    <motion.div
      role="img"
      aria-label={m.alt}
      className={cn(
        'overflow-hidden rounded-2xl border border-border bg-card shadow-2xl shadow-primary/15 select-none',
        className,
      )}
      initial={{ opacity: 0, y: 48 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.9, delay: AT.board, ease: EASE_OUT }}
    >
      <div aria-hidden="true">
        <div className="flex items-center justify-between border-b border-border px-4 py-3 sm:px-5">
          <span className="font-display text-sm font-semibold">{m.project}</span>
          <span className="flex -space-x-1.5">
            <Avatar person="marina" />
            <Avatar person="igor" />
          </span>
        </div>

        <div className="grid lg:grid-cols-[minmax(0,1fr)_21rem]">
          <div className="grid grid-cols-2 gap-3 bg-muted/40 p-4 sm:grid-cols-3 sm:gap-4 sm:p-5">
            <Column title={m.columns.todo} count={TODO.length} className="hidden sm:block">
              {TODO.map((card, index) => (
                <TaskCard key={card.id} card={card} delay={AT.cards + index * 0.08} />
              ))}
            </Column>
            <Column title={m.columns.doing} count={doing.length}>
              {doing.map((card, index) => (
                <TaskCard
                  key={card.id}
                  card={card}
                  delay={AT.cards + 0.16 + index * 0.08}
                  active={card.id === ACTIVE.id}
                />
              ))}
            </Column>
            <Column title={m.columns.done} count={done.length}>
              {done.map((card, index) => (
                <TaskCard
                  key={card.id}
                  card={card}
                  delay={AT.cards + 0.32 + index * 0.08}
                  active={card.id === ACTIVE.id}
                  enter={card.id !== ACTIVE.id}
                />
              ))}
            </Column>
          </div>

          <motion.div
            className="flex flex-col border-t border-border lg:border-t-0 lg:border-l"
            initial={{ opacity: 0, x: 36 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: AT.chat, ease: EASE_OUT }}
          >
            <div className="flex items-center gap-2.5 border-b border-border px-4 py-3">
              <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <MessagesSquare className="size-4" />
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-muted-foreground">{m.chat.title}</p>
                <p className="truncate text-[13px] font-semibold">{m.cards.landing}</p>
              </div>
            </div>

            <ul className="flex flex-1 flex-col gap-3 p-4">
              <Message person="marina" text={m.chat.first} delay={AT.first} />
              <SystemLine text={m.chat.invited} visible delay={AT.invited} />
              <Message person="igor" text={m.chat.second} delay={AT.second} mine />
              <Message person="marina" text={m.chat.third} delay={AT.third} />
              <SystemLine text={m.chat.moved} visible={moved} delay={0.3} />
            </ul>

            <div className="m-4 mt-0 flex items-center justify-between rounded-xl border border-border bg-background px-3 py-2.5 text-[13px] text-muted-foreground">
              {m.chat.placeholder}
              <Send className="size-4 text-primary" />
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
