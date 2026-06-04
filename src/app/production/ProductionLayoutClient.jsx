'use client';

import * as React from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { AudioWaveform, Earth, GalleryVerticalEnd, MessageSquare } from 'lucide-react';
import { ResponsiveLayout } from '@/components/Admin/Layout/ResponsiveLayout';
import { navigationConfig, navigationManagerConfig } from '@/configs/navgationConfig';
import { useSettings } from '@/context/SettingsContext';
import { filterNavigationByRoles } from '@/utils/navigationUtils';
import { notify } from '@/lib/notifications';
import Loader from '@/components/Utilities/Loader';

const PRODUCTION_ROLES = ['administrador', 'direccion', 'operario', 'tecnico'];

function ProductionRouteProtection({ children }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/');
      return;
    }

    if (status === 'authenticated' && session?.user) {
      const roles = Array.isArray(session.user.role) ? session.user.role : [session.user.role];
      const hasProductionAccess = roles.some((role) => PRODUCTION_ROLES.includes(role));

      if (!hasProductionAccess) {
        router.replace('/unauthorized');
      }
    }
  }, [status, session, router]);

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader />
      </div>
    );
  }

  const roles =
    session?.user?.role != null
      ? Array.isArray(session.user.role)
        ? session.user.role
        : [session.user.role]
      : [];
  const hasProductionAccess = roles.some((role) => PRODUCTION_ROLES.includes(role));

  if (status === 'authenticated' && !hasProductionAccess) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader />
      </div>
    );
  }

  return <>{children}</>;
}

export default function ProductionLayoutClient({ children }) {
  const { data: session } = useSession();
  const rawRole = session?.user?.role;
  const roles = React.useMemo(
    () => (Array.isArray(rawRole) ? rawRole.filter(Boolean) : rawRole ? [rawRole] : []),
    [rawRole]
  );

  const username = session?.user?.name || 'Desconocido';
  const email = session?.user?.email || 'Desconocido';
  const { settings, loading } = useSettings();

  const handleLogout = React.useCallback(async () => {
    sessionStorage.setItem('__is_logging_out__', 'true');

    try {
      const { logout: logoutBackend } = await import('@/services/authService');
      await logoutBackend();
    } catch (err) {
      console.error('Error en logout del backend:', err);
    }

    try {
      await signOut({ redirect: false });
    } catch (err) {
      console.error('Error en signOut:', err);
    }

    notify.success({ title: 'Sesión cerrada' });
    setTimeout(() => {
      sessionStorage.removeItem('__is_logging_out__');
      window.location.replace('/');
    }, 500);
  }, []);

  const filteredNavigationConfig = React.useMemo(
    () => filterNavigationByRoles(navigationConfig, roles),
    [roles]
  );

  const filteredManagers = React.useMemo(
    () => filterNavigationByRoles(navigationManagerConfig, roles),
    [roles]
  );

  const bottomNavItems = React.useMemo(() => {
    const productionLabelsItem = filteredManagers.find(
      (item) => item.href === '/production/number_label'
    );
    const homeItem = filteredNavigationConfig.find((item) =>
      roles.includes('operario') ? item.href === '/operator' : item.href === '/admin/home'
    );
    const chatIAItem = roles.includes('operario')
      ? null
      : {
          name: 'Chat IA',
          type: 'chat',
          icon: MessageSquare,
          href: null,
        };

    return [homeItem, productionLabelsItem, chatIAItem].filter(Boolean);
  }, [filteredManagers, filteredNavigationConfig, roles]);

  const user = React.useMemo(
    () => ({
      name: username,
      email,
      logout: handleLogout,
    }),
    [username, email, handleLogout]
  );

  const navigationItems = React.useMemo(
    () =>
      filteredNavigationConfig
        .filter((item) => item && (item.href || item.childrens?.length > 0))
        .map((item) => ({
          ...item,
          href: item.href || item.childrens?.[0]?.href || '#',
        })),
    [filteredNavigationConfig]
  );

  const apps = React.useMemo(() => {
    const companyName =
      !loading && settings?.['company.name'] ? settings['company.name'] : 'Empresa';

    return [
      { name: companyName, logo: GalleryVerticalEnd, description: 'Administración', current: false },
      { name: companyName, logo: AudioWaveform, description: 'Producción', current: true },
      { name: companyName, logo: Earth, description: 'World Trade', current: false },
    ];
  }, [settings, loading]);

  return (
    <ProductionRouteProtection>
      <ResponsiveLayout
        bottomNavItems={bottomNavItems}
        user={user}
        navigationItems={navigationItems}
        navigationManagersItems={filteredManagers}
        apps={apps}
        loading={loading}
      >
        {children}
      </ResponsiveLayout>
    </ProductionRouteProtection>
  );
}
