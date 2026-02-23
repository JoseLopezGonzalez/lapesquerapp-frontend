'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  fetchSuperadmin,
  getSuperadminToken,
  setSuperadminToken,
} from '@/lib/superadminApi';

const SuperadminAuthContext = createContext(null);

export function SuperadminAuthProvider({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [token, setTokenState] = useState(() => getSuperadminToken());
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const didMount = useRef(false);

  const login = useCallback((accessToken, userData) => {
    setSuperadminToken(accessToken);
    setTokenState(accessToken);
    setUser(userData);
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetchSuperadmin('/auth/logout', { method: 'POST' });
    } catch { /* ignore */ }
    setSuperadminToken(null);
    setTokenState(null);
    setUser(null);
    router.replace('/superadmin/login');
  }, [router]);

  const refreshUser = useCallback(async () => {
    const stored = getSuperadminToken();
    if (!stored) {
      setLoading(false);
      return;
    }
    try {
      const res = await fetchSuperadmin('/auth/me');
      const json = await res.json();
      setUser(json.data || json);
      setTokenState(stored);
    } catch {
      setSuperadminToken(null);
      setTokenState(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (didMount.current) return;
    didMount.current = true;
    refreshUser();
  }, [refreshUser]);

  useEffect(() => {
    const handler = () => {
      setTokenState(null);
      setUser(null);
      if (pathname !== '/superadmin/login') {
        router.replace('/superadmin/login');
      }
    };
    window.addEventListener('superadmin:unauthorized', handler);
    return () => window.removeEventListener('superadmin:unauthorized', handler);
  }, [router, pathname]);

  const value = { token, user, loading, login, logout, refreshUser };

  return (
    <SuperadminAuthContext.Provider value={value}>
      {children}
    </SuperadminAuthContext.Provider>
  );
}

export function useSuperadminAuth() {
  const ctx = useContext(SuperadminAuthContext);
  if (!ctx) throw new Error('useSuperadminAuth must be used within SuperadminAuthProvider');
  return ctx;
}
