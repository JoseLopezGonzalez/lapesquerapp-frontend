"use client";

/**
 * NavigationSheet - Sheet con navegación completa para mobile
 * 
 * Sheet que se abre desde abajo mostrando toda la navegación.
 * Reutiliza los componentes del Sidebar:
 * - AppSwitcher (header)
 * - NavManagers (gestores)
 * - NavMain (navegación principal)
 * - NavUser (usuario y logout)
 * 
 * Referencia: docs/mobile-adaptation/implementaciones/01-LAYOUT-NAVEGACION.md
 */

import * as React from "react";
import { usePathname } from "next/navigation";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { NavMain } from "@/components/Admin/Layout/SideBar/nav-main";
import { NavManagers } from "@/components/Admin/Layout/SideBar/nav-managers";
import { NavUser } from "@/components/Admin/Layout/SideBar/nav-user";
import { AppSwitcher } from "@/components/Admin/Layout/SideBar/app-switcher";
import {
  SidebarGroupLabel,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { MOBILE_SAFE_AREAS } from "@/lib/design-tokens-mobile";
import { cn } from "@/lib/utils";
import { isActiveRoute } from "@/utils/navigationUtils";
import "./sheet-styles.css";

/**
 * NavigationSheet - Sheet con navegación completa
 * 
 * @param {object} props
 * @param {boolean} props.open - Si el sheet está abierto
 * @param {Function} props.onOpenChange - Callback cuando cambia el estado de apertura
 * @param {object} props.user - Objeto usuario con name, email, logout
 * @param {Array} props.navigationItems - Items de navegación principal
 * @param {Array} props.navigationManagersItems - Items de gestores
 * @param {Array} props.apps - Array de apps para AppSwitcher
 * @param {boolean} props.loading - Si está cargando (para AppSwitcher)
 */
export function NavigationSheet({
  open,
  onOpenChange,
  user,
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
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        data-sheet="true"
        className={cn(
          "h-[85vh] max-h-[85vh] overflow-hidden",
          "flex flex-col p-0",
          "rounded-t-2xl", // Border radius superior para bottom sheet
          MOBILE_SAFE_AREAS.BOTTOM // Safe area iOS
        )}
      >
        <SheetHeader className="sr-only">
          <SheetTitle>Navegación</SheetTitle>
          <SheetDescription>Menú de navegación completo</SheetDescription>
        </SheetHeader>

        {/* Contenido del Sheet - Similar al Sidebar */}
        {/* Envolver en SidebarProvider para que AppSwitcher funcione */}
        <SidebarProvider>
          <div className="flex flex-col h-full min-h-0 overflow-hidden">
            {/* Header - AppSwitcher */}
            {apps && apps.length > 0 && (
              <div className="flex-shrink-0 border-b p-3">
                <AppSwitcher apps={apps} loading={loading} />
              </div>
            )}

            {/* Content - Navegación */}
            <div className="flex-1 min-h-0 overflow-y-auto flex flex-col">
              {/* Gestores */}
              {activeNavigationManagersItems && activeNavigationManagersItems.length > 0 && (
                <div className="flex-shrink-0 p-3">
                  <NavManagers items={activeNavigationManagersItems} />
                </div>
              )}

              {/* Navegación Principal */}
              <div className="flex flex-col flex-1 min-h-0">
                {activeNavigationItems && activeNavigationItems.length > 0 && (
                  <>
                    <div className="flex-shrink-0 px-4 pt-3 pb-2">
                      <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground">Navegación</SidebarGroupLabel>
                    </div>
                    <div className="flex-1 min-h-0 overflow-y-auto px-2 pb-2">
                      <NavMain items={activeNavigationItems} />
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Footer - Usuario */}
            {user && (
              <div className="flex-shrink-0 border-t p-3 mt-auto">
                <NavUser user={user} />
              </div>
            )}
          </div>
        </SidebarProvider>
        
      </SheetContent>
    </Sheet>
  );
}

