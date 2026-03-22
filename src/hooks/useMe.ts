'use client';

import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { getCurrentTenant } from '@/lib/utils/getCurrentTenant';
import { getCurrentUser } from '@/services/authService';

export function useMe() {
  const { data: session } = useSession();
  const token = session?.user?.accessToken;
  const tenantId = typeof window !== 'undefined' ? getCurrentTenant() : null;

  return useQuery({
    queryKey: ['me', tenantId ?? 'unknown', token ?? 'anonymous'],
    queryFn: () => getCurrentUser(),
    enabled: Boolean(token) && Boolean(tenantId),
    staleTime: 5 * 60 * 1000,
  });
}
