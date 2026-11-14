import { describe, expect, it } from 'vitest';

import { dictionaries } from '@/shared/i18n/dictionaries';

import { createLoginSchema, createRegisterSchema } from './schemas';

const errors = dictionaries.ru.auth.errors;

describe('auth schemas', () => {
  it('accepts valid login data', () => {
    const result = createLoginSchema(errors).safeParse({ email: 'a@b.co', password: 'x' });
    expect(result.success).toBe(true);
  });

  it('rejects an invalid email with a localized message', () => {
    const result = createLoginSchema(errors).safeParse({ email: 'nope', password: 'x' });
    expect(result.error?.issues[0]?.message).toBe(errors.emailInvalid);
  });

  it('rejects mismatched passwords on the confirm field', () => {
    const result = createRegisterSchema(errors).safeParse({
      name: 'Аня',
      email: 'a@b.co',
      password: '12345678',
      confirm: '87654321',
    });
    expect(result.error?.issues[0]).toMatchObject({
      path: ['confirm'],
      message: errors.confirmMismatch,
    });
  });
});
