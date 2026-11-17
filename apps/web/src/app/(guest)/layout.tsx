import type { ReactNode } from 'react';

import { AuthBoundary, AuthShell } from '@/features/auth';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <AuthShell>
      <AuthBoundary mode="guest">{children}</AuthBoundary>
    </AuthShell>
  );
}
