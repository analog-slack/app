import Link from 'next/link';
import type { ReactNode } from 'react';

export function AuthFormFrame({
  title,
  subtitle,
  alt,
  altLink,
  altHref,
  children,
}: {
  title: string;
  subtitle: string;
  alt: string;
  altLink: string;
  altHref: string;
  children: ReactNode;
}) {
  return (
    <>
      <h1 className="font-display text-3xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-2 text-muted-foreground">{subtitle}</p>

      <div className="mt-8">{children}</div>

      <p className="mt-6 text-sm text-muted-foreground">
        {alt}{' '}
        <Link
          href={altHref}
          className="rounded-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          {altLink}
        </Link>
      </p>
    </>
  );
}
