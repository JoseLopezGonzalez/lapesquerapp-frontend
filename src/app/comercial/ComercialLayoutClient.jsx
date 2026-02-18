'use client';

import * as React from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { ResponsiveLayout } from '@/components/Admin/Layout/ResponsiveLayout';
import { navigationConfig, navigationManagerConfig } from '@/configs/navgationConfig';
import { useSettings } from '@/context/SettingsContext';
import { filterNavigationByRoles } from '@/utils/navigationUtils';
import { notify } from '@/lib/notifications';
import Loader from '@/components/Utilities/Loader';

/** Solo permite rol comercial; redirige al resto a /admin/home */
function ComercialRouteProtection({ children }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/');
      return;
    }
    if (status === 'authenticated' && session?.user) {
      const role = Array.isArray(session.user.role) ? session.user.role[0] : session.user.role;
      if (role !== 'comercial') {
        router.replace('/admin/home');
      }
    }
  }, [status, session, router]);

  if (status === 'loading') {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader />
      </div>
    );
  }

  const role = session?.user?.role != null
    ? (Array.isArray(session.user.role) ? session.user.role[0] : session.user.role)
    : null;
  if (status === 'authenticated' && role !== 'comercial') {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader />
      </div>
    );
  }

  return <>{children}</>;
}

export default function ComercialLayoutClient({ children }) {
  const { data: session } = useSession();
  const roles = ['comercial'];
  const username = session?.user?.name || 'Desconocido';
  const email = session?.user?.email || 'Desconocido';
  const { settings, loading } = useSettings();

  const handleLogout = React.useCallback(async () => {
    try {
      const { logout: logoutBackend } = await import('@/services/authService');
      await logoutBackend();
    } catch (err) {
      console.error('Error en logout del backend:', err);
    }
    await signOut({ redirect: false });
    notify.success({ title: 'Sesión cerrada' });
    setTimeout(() => window.location.replace('/'), 500);
  }, []);

  const filteredNavigationConfig = React.useMemo(
    () => filterNavigationByRoles(navigationConfig, roles),
    [roles]
  );

  const bottomNavItems = React.useMemo(
    () => filteredNavigationConfig.filter((item) => item?.href),
    [filteredNavigationConfig]
  );

  const user = React.useMemo(
    () => ({ name: username, email: email, logout: handleLogout }),
    [username, email, handleLogout]
  );

  const navigationItems = React.useMemo(
    () =>
      filteredNavigationConfig
        .filter((item) => item && item.href)
        .map((item) => ({ ...item, href: item.href })),
    [filteredNavigationConfig]
  );

  const navigationManagersItems = React.useMemo(
    () => filterNavigationByRoles(navigationManagerConfig, roles),
    [roles]
  );

  const apps = React.useMemo(() => {
    const { GalleryVerticalEnd, AudioWaveform, Earth } = require('lucide-react');
    const companyName = !loading && settings?.['company.name'] ? settings['company.name'] : 'Empresa';
    return [
      { name: companyName, logo: GalleryVerticalEnd, description: 'Administración', current: true },
      { name: companyName, logo: AudioWaveform, description: 'Producción', current: false },
      { name: companyName, logo: Earth, description: 'World Trade', current: false },
    ];
  }, [settings, loading]);

  return (
    <ComercialRouteProtection>
      <ResponsiveLayout
        bottomNavItems={bottomNavItems}
        user={user}
        navigationItems={navigationItems}
        navigationManagersItems={navigationManagersItems}
        apps={apps}
        loading={loading}
      >
        {children}
      </ResponsiveLayout>
    </ComercialRouteProtection>
  );
}
