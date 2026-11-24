import { z } from 'zod';

import type { Dictionary } from '@/shared/i18n';

type AuthErrors = Dictionary['auth']['errors'];

/** Схемы создаются фабрикой, чтобы тексты ошибок были на языке интерфейса. */
export function createLoginSchema(errors: AuthErrors) {
  return z.object({
    email: z.string().trim().max(255, errors.emailInvalid).pipe(z.email(errors.emailInvalid)),
    password: z.string().min(1, errors.passwordRequired).max(128, errors.passwordMax),
  });
}

export function createRegisterSchema(errors: AuthErrors) {
  return z
    .object({
      name: z.string().trim().min(1, errors.nameRequired).max(100, errors.nameMax),
      email: z.string().trim().max(255, errors.emailInvalid).pipe(z.email(errors.emailInvalid)),
      password: z.string().min(8, errors.passwordMin).max(128, errors.passwordMax),
      confirm: z.string(),
    })
    .refine((values) => values.password === values.confirm, {
      path: ['confirm'],
      error: errors.confirmMismatch,
    });
}

export type LoginValues = z.infer<ReturnType<typeof createLoginSchema>>;
export type RegisterValues = z.infer<ReturnType<typeof createRegisterSchema>>;
