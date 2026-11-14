'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { useI18n } from '@/shared/i18n';

import { createLoginSchema, type LoginValues } from '../model/schemas';
import { AuthFormFrame } from './auth-form-frame';
import { TextField } from './text-field';

export function LoginForm() {
  const { t } = useI18n();
  const a = t.auth;
  const schema = useMemo(() => createLoginSchema(a.errors), [a.errors]);
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  // TODO: заменить на запрос к API авторизации
  const onSubmit = () => setSubmitted(true);

  return (
    <AuthFormFrame
      title={a.login.title}
      subtitle={a.login.subtitle}
      notice={submitted ? a.stub : undefined}
      alt={a.login.alt}
      altLink={a.login.altLink}
      altHref="/register"
    >
      <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <TextField
          label={a.fields.email}
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          {...register('email')}
        />
        <TextField
          label={a.fields.password}
          type="password"
          autoComplete="current-password"
          error={errors.password?.message}
          {...register('password')}
        />
        <Button type="submit" size="lg" className="h-11 w-full">
          {a.login.submit}
        </Button>
      </form>
    </AuthFormFrame>
  );
}
