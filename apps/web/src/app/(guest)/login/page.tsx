import { LoginForm } from '@/features/auth';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string | string[] }>;
}) {
  const { returnTo } = await searchParams;
  return <LoginForm returnTo={typeof returnTo === 'string' ? returnTo : undefined} />;
}
