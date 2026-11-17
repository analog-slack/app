import type { ReactNode } from 'react';

import { AuthBoundary, AuthShell } from '@/features/auth';

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  return (
    <AuthShell>
      <AuthBoundary mode="protected">{children}</AuthBoundary>
    </AuthShell>
  );
}
