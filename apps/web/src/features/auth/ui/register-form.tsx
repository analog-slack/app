'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useAuthRegister } from '@packages/api';
import { LoaderCircle } from 'lucide-react';
import { type SubmitEvent, useMemo } from 'react';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { getApiErrorStatus } from '@/shared/api';
import { ROUTES, withReturnTo } from '@/shared/config';
import { useI18n } from '@/shared/i18n';

import { createRegisterSchema, type RegisterValues } from '../model/schemas';
import { useAuthSession } from '../model/use-auth-session';
import { AuthFormFrame } from './auth-form-frame';
import { TextField } from './text-field';

export function RegisterForm({ returnTo }: { returnTo?: string }) {
  const { t } = useI18n();
  const a = t.auth;
  const schema = useMemo(() => createRegisterSchema(a.errors), [a.errors]);
  const { mutateAsync } = useAuthRegister();
  const { setSession } = useAuthSession();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', email: '', password: '', confirm: '' },
  });

  async function onSubmit({ name, email, password }: RegisterValues) {
    try {
      await setSession(await mutateAsync({ data: { username: name, email, password } }));
    } catch (error) {
      setError('root', {
        message: getApiErrorStatus(error) === 409 ? a.errors.accountExists : a.errors.unavailable,
      });
    }
  }

  return (
    <AuthFormFrame
      title={a.register.title}
      subtitle={a.register.subtitle}
      alt={a.register.alt}
      altLink={a.register.altLink}
      altHref={withReturnTo(ROUTES.LOGIN, returnTo)}
    >
      <form
        noValidate
        onSubmit={(event: SubmitEvent<HTMLFormElement>) => void handleSubmit(onSubmit)(event)}
        className="space-y-4"
      >
        <TextField
          label={a.fields.name}
          autoComplete="username"
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
        {errors.root?.message && (
          <p role="alert" className="text-sm text-destructive">
            {errors.root.message}
          </p>
        )}
        <Button type="submit" size="lg" className="h-11 w-full" disabled={isSubmitting}>
          {isSubmitting && <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />}
          {a.register.submit}
        </Button>
      </form>
    </AuthFormFrame>
  );
}
