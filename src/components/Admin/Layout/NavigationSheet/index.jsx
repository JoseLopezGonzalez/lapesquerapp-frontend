"use client";

/**
 * NavigationSheet - Sheet con navegación completa para mobile
 * 
 * Implementado con vaul (compatible con React 19)
 * Documentación: https://vaul.emilkowalski.dev/
 */

import * as React from "react";
import { usePathname } from "next/navigation";
import { Drawer } from "vaul";
import { NavMain } from "@/components/Admin/Layout/SideBar/nav-main";
import { NavManagers } from "@/components/Admin/Layout/SideBar/nav-managers";
import { AppSwitcher } from "@/components/Admin/Layout/SideBar/app-switcher";
import {
  SidebarGroupLabel,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { MOBILE_SAFE_AREAS } from "@/lib/design-tokens-mobile";
import { cn } from "@/lib/utils";
import { isActiveRoute } from "@/utils/navigationUtils";

export function NavigationSheet({
  open,
  onOpenChange,
  navigationItems = [],
  navigationManagersItems = [],
  apps = [],
  loading = false,
}) {
  const pathname = usePathname();

  // Marcar rutas activas
  const activeNavigationItems = React.useMemo(() =>
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

  const activeNavigationManagersItems = React.useMemo(() =>
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
            "fixed bottom-0 left-0 right-0 z-50 mt-24 flex h-[85vh] flex-col rounded-t-[10px] bg-background",
            MOBILE_SAFE_AREAS.BOTTOM
          )}
        >
          <Drawer.Title className="sr-only">Navegación</Drawer.Title>
          <Drawer.Description className="sr-only">Menú de navegación completo</Drawer.Description>
          
          {/* Handle visual para drag */}
          <div className="mx-auto mt-4 flex h-1.5 w-12 flex-shrink-0 rounded-full bg-muted-foreground/30" />
          
          <div className="flex flex-col h-full min-h-0 overflow-hidden w-full 
            [&_[data-sidebar=menu-button]]:min-h-[56px] 
            [&_[data-sidebar=menu-button]]:text-base 
            [&_[data-sidebar=menu-button]]:px-4 
            [&_[data-sidebar=menu-button]]:py-3 
            [&_[data-sidebar=menu-button]]:gap-3 
            [&_[data-sidebar=menu-button]_svg]:size-6 
            [&_[data-sidebar=menu-sub-button]]:min-h-[52px] 
            [&_[data-sidebar=menu-sub-button]]:text-base 
            [&_[data-sidebar=menu-sub-button]]:px-4 
            [&_[data-sidebar=menu-sub-button]]:py-3 
            [&_[data-sidebar=menu-sub-button]_svg]:size-5 
            [&_[data-sidebar=group-label]]:text-sm 
            [&_[data-sidebar=group-label]]:px-4 
            [&_[data-sidebar=group-label]]:py-3
            [&_[data-sidebar=menu-button][data-size=lg]]:min-h-[64px]
            [&_[data-sidebar=menu-button][data-size=lg]]:text-base">
            <SidebarProvider>
              <div className="flex flex-col h-full min-h-0 overflow-hidden w-full">
                {apps && apps.length > 0 && (
                  <div className="flex-shrink-0 border-b p-4 w-full">
                    <AppSwitcher apps={apps} loading={loading} />
                  </div>
                )}

                <div className="flex-1 min-h-0 overflow-y-auto w-full pb-24">
                  {activeNavigationManagersItems && activeNavigationManagersItems.length > 0 && (
                    <div className="p-4 w-full">
                      <NavManagers items={activeNavigationManagersItems} />
                    </div>
                  )}

                  {activeNavigationItems && activeNavigationItems.length > 0 && (
                    <>
                      <div className="px-4 pt-4 pb-3 w-full">
                        <SidebarGroupLabel className="text-sm font-semibold text-muted-foreground">
                          Navegación
                        </SidebarGroupLabel>
                      </div>
                      <div className="px-2 pb-24 mb-8 w-full">
                        <NavMain items={activeNavigationItems} />
                      </div>
                    </>
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
