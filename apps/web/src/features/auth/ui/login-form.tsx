'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useAuthLogin } from '@packages/api';
import { LoaderCircle } from 'lucide-react';
import { type SubmitEvent, useMemo } from 'react';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { getApiErrorStatus } from '@/shared/api';
import { ROUTES, withReturnTo } from '@/shared/config';
import { useI18n } from '@/shared/i18n';
import { TextField } from '@/shared/ui';

import { createLoginSchema, type LoginValues } from '../model/schemas';
import { useAuthSession } from '../model/use-auth-session';
import { AuthFormFrame } from './auth-form-frame';

export function LoginForm({ returnTo }: { returnTo?: string }) {
  const { t } = useI18n();
  const a = t.auth;
  const schema = useMemo(() => createLoginSchema(a.errors), [a.errors]);
  const { mutateAsync } = useAuthLogin();
  const { setSession } = useAuthSession();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  async function onSubmit(data: LoginValues) {
    try {
      await setSession(await mutateAsync({ data }));
    } catch (error) {
      setError('root', {
        message:
          getApiErrorStatus(error) === 401 ? a.errors.invalidCredentials : a.errors.unavailable,
      });
    }
  }

  return (
    <AuthFormFrame
      title={a.login.title}
      subtitle={a.login.subtitle}
      alt={a.login.alt}
      altLink={a.login.altLink}
      altHref={withReturnTo(ROUTES.REGISTER, returnTo)}
    >
      <form
        noValidate
        onSubmit={(event: SubmitEvent<HTMLFormElement>) => void handleSubmit(onSubmit)(event)}
        className="space-y-4"
      >
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
        {errors.root?.message && (
          <p role="alert" className="text-sm text-destructive">
            {errors.root.message}
          </p>
        )}
        <Button type="submit" size="lg" className="h-11 w-full" disabled={isSubmitting}>
          {isSubmitting && <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />}
          {a.login.submit}
        </Button>
      </form>
    </AuthFormFrame>
  );
}
