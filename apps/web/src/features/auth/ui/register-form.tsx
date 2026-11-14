'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { useI18n } from '@/shared/i18n';

import { createRegisterSchema, type RegisterValues } from '../model/schemas';
import { AuthFormFrame } from './auth-form-frame';
import { TextField } from './text-field';

export function RegisterForm() {
  const { t } = useI18n();
  const a = t.auth;
  const schema = useMemo(() => createRegisterSchema(a.errors), [a.errors]);
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', email: '', password: '', confirm: '' },
  });

  // TODO: заменить на запрос к API регистрации
  const onSubmit = () => setSubmitted(true);

  return (
    <AuthFormFrame
      title={a.register.title}
      subtitle={a.register.subtitle}
      notice={submitted ? a.stub : undefined}
      alt={a.register.alt}
      altLink={a.register.altLink}
      altHref="/login"
    >
      <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <TextField
          label={a.fields.name}
          autoComplete="name"
          error={errors.name?.message}
          {...register('name')}
        />
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
          autoComplete="new-password"
          error={errors.password?.message}
          {...register('password')}
        />
        <TextField
          label={a.fields.confirm}
          type="password"
          autoComplete="new-password"
          error={errors.confirm?.message}
          {...register('confirm')}
        />
        <Button type="submit" size="lg" className="h-11 w-full">
          {a.register.submit}
        </Button>
      </form>
    </AuthFormFrame>
  );
}
