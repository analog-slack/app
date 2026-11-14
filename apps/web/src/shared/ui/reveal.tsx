'use client';

import { motion } from 'motion/react';
import type { ReactNode } from 'react';

export const EASE_OUT = [0.22, 1, 0.36, 1] as const;

/** Появление блока, когда он попадает в область просмотра. Срабатывает один раз. */
export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.7, delay, ease: EASE_OUT }}
    >
      {children}
    </motion.div>
  );
}
