import { RegisterForm } from '@/features/auth';

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string | string[] }>;
}) {
  const { returnTo } = await searchParams;
  return <RegisterForm returnTo={typeof returnTo === 'string' ? returnTo : undefined} />;
}
