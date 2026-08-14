'use client';

import * as React from 'react';
import { signOut, useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import {
  Building2,
  Warehouse,
  LayoutDashboard,
  Factory,
  ClipboardList,
  PackageCheck,
  Undo2,
  Receipt,
} from 'lucide-react';
import { NavigationSheet } from '@/components/Admin/Layout/NavigationSheet';
import { BottomNav } from '@/components/Admin/Layout/BottomNav';
import { ExternalSidebar } from '@/components/External/ExternalSidebar';
import { ExternalUserMenuDialog } from '@/components/External/ExternalUserMenuDialog';
import { useIsMobileSafe } from '@/hooks/use-mobile';
import { notify } from '@/lib/notifications';
import { isTollClient } from '@/lib/auth/actor';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

/** Navegación completa del portal de maquila (sidebar desktop + sheet mobile) */
const MAQUILA_NAVIGATION_ITEMS = [
  { name: 'Inicio', href: '/external/maquila', icon: LayoutDashboard },
  { name: 'Almacén', href: '/external/maquila/almacen', icon: Warehouse },
  { name: 'Producciones', href: '/external/maquila/producciones', icon: Factory },
  { name: 'Pedidos', href: '/external/maquila/pedidos', icon: ClipboardList },
  { name: 'Recepciones', href: '/external/maquila/recepciones', icon: PackageCheck },
  { name: 'Devoluciones', href: '/external/maquila/devoluciones', icon: Undo2 },
  { name: 'Cargo de servicio', href: '/external/maquila/cargo-servicio', icon: Receipt },
];

/** Subconjunto priorizado para el BottomNav mobile (tope 4, ver BottomNav) */
const MAQUILA_BOTTOM_NAV_ITEMS = MAQUILA_NAVIGATION_ITEMS.slice(0, 4);

/** Navegación del ExternalUser genérico (sin tollClientId) — solo almacenes/palets */
const GENERIC_EXTERNAL_NAVIGATION_ITEMS = [
  { name: 'Almacenes', href: '/external/stores-manager', icon: Warehouse },
];

function ExternalLayoutContent({ children }) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const { isMobile, mounted } = useIsMobileSafe();
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const [userMenuOpen, setUserMenuOpen] = React.useState(false);
  const mainRef = React.useRef(null);

  const allowedStoreIds = React.useMemo(
    () => (Array.isArray(session?.user?.allowedStoreIds) ? session.user.allowedStoreIds : []),
    [session?.user?.allowedStoreIds]
  );

  const isMaquilaPortal = isTollClient(session?.user);

  const handleLogout = React.useCallback(async () => {
    sessionStorage.setItem('__is_logging_out__', 'true');

    try {
      const { logout: logoutBackend } = await import('@/services/authService');
      await logoutBackend();
    } catch (error) {
      console.error('Error en logout del backend:', error);
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

  React.useEffect(() => {
    if (sheetOpen) {
      setSheetOpen(false);
    }
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  const navigationItems = React.useMemo(
    () => (isMaquilaPortal ? MAQUILA_NAVIGATION_ITEMS : GENERIC_EXTERNAL_NAVIGATION_ITEMS),
    [isMaquilaPortal]
  );

  const bottomNavItems = React.useMemo(
    () => (isMaquilaPortal ? MAQUILA_BOTTOM_NAV_ITEMS : GENERIC_EXTERNAL_NAVIGATION_ITEMS),
    [isMaquilaPortal]
  );

  const user = React.useMemo(
    () => ({
      name: session?.user?.name || 'Usuario externo',
      email: session?.user?.email || '',
      image: session?.user?.image || '',
      companyName: session?.user?.tollClientName || session?.user?.companyName || 'PesquerApp',
      companyLogoUrl: session?.user?.companyLogoUrl || '',
      externalUserType: session?.user?.externalUserType || null,
      allowedStoreIds,
      logout: handleLogout,
    }),
    [allowedStoreIds, handleLogout, session]
  );

  const apps = React.useMemo(
    () => [
      {
        name: user.companyName,
        logo: Building2,
        description: 'Acceso externo',
        current: true,
      },
    ],
    [user.companyName]
  );

  const styleSidebar = {
    '--sidebar-width': '18rem',
    '--sidebar-width-mobile': '18rem',
  };

  if (!mounted || !isMobile) {
    return (
      <div className="bg-muted/30 h-screen overflow-hidden">
        <SidebarProvider className="h-full" style={styleSidebar}>
          <ExternalSidebar user={user} apps={apps} navigationItems={navigationItems} />
          <main className="flex h-full min-h-0 w-full flex-col overflow-hidden p-1">
            <div className="shrink-0 p-1">
              <SidebarTrigger />
            </div>
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-1">{children}</div>
          </main>
        </SidebarProvider>
      </div>
    );
  }

  return (
    <div
      className={cn('bg-background relative flex h-screen flex-col overflow-hidden')}
      vaul-drawer-wrapper=""
    >
      <main
        ref={mainRef}
        className={cn(
          'relative w-full overflow-hidden',
          bottomNavItems.length > 0
            ? 'h-[calc(100vh-5rem-env(safe-area-inset-bottom))]'
            : 'min-h-0 flex-1'
        )}
      >
        <div className="h-full w-full">{children}</div>
      </main>

      <BottomNav items={bottomNavItems} sheetOpen={sheetOpen} onSheetOpenChange={setSheetOpen} />

      <ExternalUserMenuDialog open={userMenuOpen} onOpenChange={setUserMenuOpen} user={user} />

      <NavigationSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        navigationItems={navigationItems}
        navigationManagersItems={[]}
        apps={apps}
        user={user}
        onUserMenuOpen={() => {
          setSheetOpen(false);
          setUserMenuOpen(true);
        }}
      />
    </div>
  );
}

export default function ExternalLayoutClient({ children }) {
  return <ExternalLayoutContent>{children}</ExternalLayoutContent>;
}
