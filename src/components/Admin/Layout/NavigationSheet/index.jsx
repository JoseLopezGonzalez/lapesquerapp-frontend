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
import { useSwipe } from "@/hooks/use-swipe";
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
  
  // Hook para detectar swipe down y cerrar el sheet
  const swipeHandlers = useSwipe({
    onSwipeDown: () => {
      onOpenChange(false);
    },
    threshold: 50, // Distancia mínima de 50px para considerar swipe
  });

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
          "w-full max-w-full", // Ancho completo sin restricciones
          "flex flex-col p-0 m-0", // Sin padding ni margin
          "rounded-t-2xl", // Border radius superior para bottom sheet
          MOBILE_SAFE_AREAS.BOTTOM // Safe area iOS
        )}
      >
        <SheetHeader className="sr-only">
          <SheetTitle>Navegación</SheetTitle>
          <SheetDescription>Menú de navegación completo</SheetDescription>
        </SheetHeader>

        {/* Barra indicadora para cerrar - Fija arriba */}
        <div 
          {...swipeHandlers} 
          className="flex-shrink-0 flex items-center justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing"
        >
          <div className="w-12 h-1 rounded-full bg-muted-foreground/30" />
        </div>

        {/* Contenido del Sheet - AppSwitcher fijo + resto scrollable */}
        {/* Envolver en SidebarProvider para que AppSwitcher funcione */}
        <SidebarProvider>
          <div className="flex flex-col h-full min-h-0 overflow-hidden w-full">
            {/* Header - AppSwitcher FIJActually */}
            {apps && apps.length > 0 && (
              <div className="flex-shrink-0 border-b p-3 w-full">
                <AppSwitcher apps={apps} loading={loading} />
              </div>
            )}

            {/* Contenedor scrollable con el resto del contenido */}
            <div className="flex-1 min-h-0 overflow-y-auto w-full">
              {/* Gestores */}
              {activeNavigationManagersItems && activeNavigationManagersItems.length > 0 && (
                <div className="p-3 w-full">
                  <NavManagers items={activeNavigationManagersItems} />
                </div>
              )}

              {/* Navegación Principal */}
              {activeNavigationItems && activeNavigationItems.length > 0 && (
                <>
                  <div className="px-4 pt-3 pb-2 w-full">
                    <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground">Navegación</SidebarGroupLabel>
                  </div>
                  <div className="px-2 pb-4 w-full">
                    <NavMain items={activeNavigationItems} />
                  </div>
                </>
              )}

              {/* Footer - Usuario */}
              {user && (
                <div className="border-t p-3 w-full">
                  <NavUser user={user} />
                </div>
              )}
            </div>
          </div>
        </SidebarProvider>
        
      </SheetContent>
    </Sheet>
  );
}

