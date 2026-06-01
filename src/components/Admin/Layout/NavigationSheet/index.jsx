'use client';

/**
 * NavigationSheet - Sheet con navegación completa para mobile
 *
 * Implementado con vaul (compatible con React 19)
 * Incluye entrada "Cuenta" que abre el menú de usuario (perfil, configuración, cerrar sesión).
 * Documentación: https://vaul.emilkowalski.dev/
 */

import * as React from 'react';
import { usePathname } from 'next/navigation';
import { Drawer } from 'vaul';
import { User } from 'lucide-react';
import { NavMain } from '@/components/Admin/Layout/SideBar/nav-main';
import { NavManagers } from '@/components/Admin/Layout/SideBar/nav-managers';
import { AppSwitcher } from '@/components/Admin/Layout/SideBar/app-switcher';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { SidebarGroupLabel, SidebarProvider } from '@/components/ui/sidebar';
import { MOBILE_SAFE_AREAS } from '@/lib/design-tokens-mobile';
import { cn } from '@/lib/utils';
import { isActiveRoute } from '@/utils/navigationUtils';

export function NavigationSheet({
  open,
  onOpenChange,
  navigationItems = [],
  navigationManagersItems = [],
  apps = [],
  loading = false,
  user = null,
  onUserMenuOpen,
}) {
  const pathname = usePathname();

  // Marcar rutas activas
  const activeNavigationItems = React.useMemo(
    () =>
      navigationItems
        .filter((item) => item && (item.href || item.childrens?.[0]?.href))
        .map((item) => {
          const itemHref = item.href || item.childrens?.[0]?.href || '#';
          return isActiveRoute(itemHref, pathname)
            ? { ...item, isActive: true, href: itemHref }
            : { ...item, isActive: false, href: itemHref };
        }),
    [navigationItems, pathname]
  );

  const activeNavigationManagersItems = React.useMemo(
    () =>
      navigationManagersItems
        .filter((item) => item && item.href)
        .map((item) =>
          isActiveRoute(item.href, pathname)
            ? { ...item, current: true }
            : { ...item, current: false }
        ),
    [navigationManagersItems, pathname]
  );

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange} shouldScaleBackground>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-black/80" />
        <Drawer.Content
          className={cn(
            'bg-background fixed right-0 bottom-0 left-0 z-50 mt-24 flex h-[85vh] flex-col rounded-t-[10px]',
            MOBILE_SAFE_AREAS.BOTTOM
          )}
        >
          <Drawer.Title className="sr-only">Navegación</Drawer.Title>
          <Drawer.Description className="sr-only">Menú de navegación completo</Drawer.Description>

          {/* Handle visual para drag */}
          <div className="bg-muted-foreground/30 mx-auto mt-4 flex h-1.5 w-12 flex-shrink-0 rounded-full" />

          <div className="flex h-full min-h-0 w-full flex-col overflow-hidden [&_[data-sidebar=group-label]]:px-4 [&_[data-sidebar=group-label]]:py-3 [&_[data-sidebar=group-label]]:text-sm [&_[data-sidebar=menu-button]]:min-h-[56px] [&_[data-sidebar=menu-button]]:gap-3 [&_[data-sidebar=menu-button]]:px-4 [&_[data-sidebar=menu-button]]:py-3 [&_[data-sidebar=menu-button]]:text-base [&_[data-sidebar=menu-button]_svg]:size-6 [&_[data-sidebar=menu-button][data-size=lg]]:min-h-[64px] [&_[data-sidebar=menu-button][data-size=lg]]:text-base [&_[data-sidebar=menu-sub-button]]:min-h-[52px] [&_[data-sidebar=menu-sub-button]]:px-4 [&_[data-sidebar=menu-sub-button]]:py-3 [&_[data-sidebar=menu-sub-button]]:text-base [&_[data-sidebar=menu-sub-button]_svg]:size-5">
            <SidebarProvider>
              <div className="flex h-full min-h-0 w-full flex-col overflow-hidden">
                {apps && apps.length > 0 && (
                  <div className="w-full flex-shrink-0 border-b p-4">
                    <AppSwitcher apps={apps} loading={loading} />
                  </div>
                )}

                <div className="min-h-0 w-full flex-1 overflow-y-auto pb-24">
                  {activeNavigationManagersItems && activeNavigationManagersItems.length > 0 && (
                    <div className="w-full p-4">
                      <NavManagers items={activeNavigationManagersItems} />
                    </div>
                  )}

                  {activeNavigationItems && activeNavigationItems.length > 0 && (
                    <>
                      <div className="w-full px-4 pt-4 pb-3">
                        <SidebarGroupLabel className="text-muted-foreground text-sm font-semibold">
                          Navegación
                        </SidebarGroupLabel>
                      </div>
                      <div className="w-full px-2 pb-4">
                        <NavMain items={activeNavigationItems} />
                      </div>
                    </>
                  )}

                  {/* Cuenta / Menú de usuario - abre el diálogo de usuario */}
                  {user && onUserMenuOpen && (
                    <div className="w-full flex-shrink-0 border-t px-4 py-3">
                      <button
                        type="button"
                        onClick={onUserMenuOpen}
                        className={cn(
                          'flex w-full items-center gap-3',
                          'min-h-[56px] rounded-lg px-4 py-3',
                          'text-left text-base font-medium',
                          'hover:bg-accent active:bg-accent/80',
                          'transition-colors duration-150'
                        )}
                        aria-label="Cuenta y menú de usuario"
                      >
                        <Avatar className="h-10 w-10 shrink-0 rounded-lg">
                          <AvatarImage src={user?.avatar} alt={user?.name} />
                          <AvatarFallback className="rounded-lg text-sm font-semibold">
                            {user?.name
                              ? user.name
                                  .split(' ')
                                  .map((n) => n[0])
                                  .join('')
                                  .toUpperCase()
                                  .slice(0, 2)
                              : 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex min-w-0 flex-1 flex-col text-left">
                          <span className="truncate font-medium">{user?.name || 'Usuario'}</span>
                          <span className="text-muted-foreground truncate text-sm">
                            {user?.email || ''}
                          </span>
                        </div>
                        <User className="text-muted-foreground h-5 w-5 shrink-0" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </SidebarProvider>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
