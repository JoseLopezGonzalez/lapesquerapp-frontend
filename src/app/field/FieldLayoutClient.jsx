'use client';

import * as React from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { GalleryVerticalEnd } from 'lucide-react';
import { ResponsiveLayout } from '@/components/Admin/Layout/ResponsiveLayout';
import { navigationConfig, navigationManagerConfig } from '@/configs/navgationConfig';
import { FieldOperatorProvider, useFieldOperator } from '@/context/FieldOperatorContext';
import { filterNavigationByRoles } from '@/utils/navigationUtils';
import { notify } from '@/lib/notifications';
import Loader from '@/components/Utilities/Loader';
import ErrorFieldOperatorNotLinked from '@/components/Field/ErrorFieldOperatorNotLinked';

function FieldRouteProtection({ children }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/');
      return;
    }
    if (status === 'authenticated' && session?.user) {
      const role = Array.isArray(session.user.role) ? session.user.role[0] : session.user.role;
      if (role !== 'repartidor_autoventa') {
        router.replace('/admin/home');
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

  const role =
    session?.user?.role != null
      ? Array.isArray(session.user.role)
        ? session.user.role[0]
        : session.user.role
      : null;

  if (status === 'authenticated' && role !== 'repartidor_autoventa') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader />
      </div>
    );
  }

  return <>{children}</>;
}

export default function FieldLayoutClient({ children }) {
  const { data: session } = useSession();
  const roles = React.useMemo(() => ['repartidor_autoventa'], []);
  const username = session?.user?.name || 'Desconocido';
  const email = session?.user?.email || 'Desconocido';
  const companyName = session?.user?.companyName || session?.user?.tenantName || 'Empresa';

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

  const bottomNavItems = React.useMemo(
    () => filteredNavigationConfig.filter((item) => item?.href),
    [filteredNavigationConfig]
  );

  const user = React.useMemo(
    () => ({ name: username, email, logout: handleLogout }),
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
    return [
      {
        name: companyName,
        logo: GalleryVerticalEnd,
        description: 'Operativa de reparto',
        current: true,
      },
    ];
  }, [companyName]);

  return (
    <FieldRouteProtection>
      <FieldOperatorProvider>
        <FieldContentGate
          bottomNavItems={bottomNavItems}
          user={user}
          navigationItems={navigationItems}
          navigationManagersItems={navigationManagersItems}
          apps={apps}
          loading={false}
        >
          {children}
        </FieldContentGate>
      </FieldOperatorProvider>
    </FieldRouteProtection>
  );
}

function FieldContentGate({
  children,
  bottomNavItems,
  user,
  navigationItems,
  navigationManagersItems,
  apps,
  loading,
}) {
  const { fieldOperatorId, isLoading, refetch } = useFieldOperator();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (!fieldOperatorId) {
    return <ErrorFieldOperatorNotLinked onRetry={() => refetch()} isLoading={isLoading} />;
  }

  return (
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
  );
}
