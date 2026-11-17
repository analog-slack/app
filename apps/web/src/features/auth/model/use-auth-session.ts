'use client';

import { getAuthProfileQueryKey, useAuthProfile, type AuthResponseDto } from '@packages/api';
import { useQueryClient } from '@tanstack/react-query';

export function useSessionProfile() {
  return useAuthProfile({ query: { retry: false, staleTime: 30_000 } });
}

export function useAuthSession() {
  const queryClient = useQueryClient();
  const queryKey = getAuthProfileQueryKey();

  async function setSession(session: AuthResponseDto) {
    await queryClient.cancelQueries({ queryKey });
    queryClient.setQueryData(queryKey, session.user);
  }

  function clearSession() {
    queryClient.clear();
  }

  return { setSession, clearSession };
}
