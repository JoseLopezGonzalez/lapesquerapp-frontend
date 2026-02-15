'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { getSettings } from '@/services/settingsService';
import { getCurrentTenant } from '@/lib/utils/getCurrentTenant';
import { invalidateSettingsCache } from '@/helpers/getSettingValue';
import { isAuthError } from '@/configs/authConfig';
import { signOut } from 'next-auth/react';

const SETTINGS_QUERY_KEY = 'settings';

/**
 * React Query hook for tenant settings.
 * Replaces manual fetch in SettingsContext.
 * @returns {{ data, isLoading, error, refetch, setSettings }}
 */
export function useSettingsData() {
  const { data: session, status } = useSession();
  const accessToken = session?.user?.accessToken;
  const queryClient = useQueryClient();

  const [tenantId, setTenantId] = useState(() =>
    typeof window !== 'undefined' ? getCurrentTenant() : null
  );

  // Detect tenant change when user returns to tab (e.g. switched subdomain)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const checkTenant = () => {
      const current = getCurrentTenant();
      setTenantId((prev) => (prev !== current ? current : prev));
    };
    const onVisible = () => {
      if (document.visibilityState === 'visible') checkTenant();
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', checkTenant);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', checkTenant);
    };
  }, []);

  const enabled = Boolean(tenantId && status !== 'loading' && accessToken);

  const query = useQuery({
    queryKey: [SETTINGS_QUERY_KEY, tenantId],
    queryFn: async () => {
      const data = await getSettings();
      if (data === null) return null;
      return data;
    },
    enabled,
    staleTime: 60 * 1000,
    retry: (failureCount, error) => {
      if (isAuthError(error)) return false;
      return failureCount < 2;
    },
  });

  // Handle 401/403: signOut (match SettingsContext behavior)
  useEffect(() => {
    if (query.error && isAuthError(query.error)) {
      signOut({ redirect: false }).catch(() => {});
    }
  }, [query.error]);

  const setSettings = (newData) => {
    if (tenantId) {
      queryClient.setQueryData([SETTINGS_QUERY_KEY, tenantId], newData);
      invalidateSettingsCache(tenantId);
    } else {
      invalidateSettingsCache(null);
    }
  };

  return {
    settings: query.data ?? {},
    loading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    setSettings,
  };
}
