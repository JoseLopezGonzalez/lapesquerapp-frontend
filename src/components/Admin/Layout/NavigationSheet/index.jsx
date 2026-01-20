"use client";

/**
 * NavigationSheet - Sheet con navegación completa para mobile
 * 
 * Sheet que se abre desde abajo mostrando la navegación completa.
 * Reutiliza temporalmente componentes del Sidebar:
 * - AppSwitcher (header)
 * - NavManagers (gestores)
 * - NavMain (navegación principal)
 * 
 * NOTA: En mobile NO se muestra la sección de usuario (se gestiona desde FloatingUserMenu).
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
import { AppSwitcher } from "@/components/Admin/Layout/SideBar/app-switcher";
import {
  SidebarGroupLabel,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { MOBILE_SAFE_AREAS } from "@/lib/design-tokens-mobile";
import { cn } from "@/lib/utils";
import { isActiveRoute } from "@/utils/navigationUtils";
import { useDragToClose } from "@/hooks/use-drag-to-close";
import "./sheet-styles.css";

/**
 * NavigationSheet - Sheet con navegación completa
 * 
 * @param {object} props
 * @param {boolean} props.open - Si el sheet está abierto
 * @param {Function} props.onOpenChange - Callback cuando cambia el estado de apertura
 * @param {Array} props.navigationItems - Items de navegación principal
 * @param {Array} props.navigationManagersItems - Items de gestores
 * @param {Array} props.apps - Array de apps para AppSwitcher
 * @param {boolean} props.loading - Si está cargando (para AppSwitcher)
 * @param {object} props.bottomNavDragState - Estado del drag desde BottomNav { translateY, isDragging }
 */
export function NavigationSheet({
  open,
  onOpenChange,
  navigationItems = [],
  navigationManagersItems = [],
  apps = [],
  loading = false,
  bottomNavDragState = { translateY: 0, isDragging: false },
}) {
  const pathname = usePathname();
  const dragHandleRef = React.useRef(null);
  const sheetContentRef = React.useRef(null);
  
  // Hook para drag-to-open/close fluido que sigue el dedo
  const { translateY: sheetTranslateY, isDragging: sheetIsDragging, handlers: dragHandlers } = useDragToClose({
    isOpen: open,
    onClose: () => onOpenChange(false),
    onOpen: () => onOpenChange(true),
    threshold: 0.3, // 30% de altura para cerrar/abrir
    velocityThreshold: 0.5, // px/ms - velocidad mínima para cerrar/abrir automáticamente
    dragHandleRef,
  });
  
  // Usar translateY del sheet cuando está abierto, o del BottomNav cuando está cerrado
  const translateY = open ? sheetTranslateY : bottomNavDragState.translateY;
  const isDragging = open ? sheetIsDragging : bottomNavDragState.isDragging;
  
  // Aplicar transform al SheetContent cuando se está arrastrando
  React.useEffect(() => {
    if (sheetContentRef.current) {
      if (isDragging && translateY !== 0) {
        // Desactivar animaciones CSS durante el drag
        sheetContentRef.current.style.transition = 'none';
        sheetContentRef.current.style.transform = `translateY(${translateY}px)`;
      } else {
        // Restaurar animaciones cuando no se está arrastrando
        sheetContentRef.current.style.transition = '';
        sheetContentRef.current.style.transform = '';
      }
    }
  }, [isDragging, translateY]);

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

  // Mostrar el sheet si está abierto O si se está arrastrando desde BottomNav (para drag-to-open)
  // Cuando se arrastra desde BottomNav, translateY va de sheetHeight (cerrado) a 0 (abierto)
  const shouldShowSheet = open || (bottomNavDragState.isDragging && bottomNavDragState.translateY > 0);

  return (
    <Sheet open={shouldShowSheet} onOpenChange={onOpenChange}>
      <SheetContent
        ref={sheetContentRef}
        side="bottom"
        data-sheet="true"
        data-dragging={isDragging ? "true" : undefined}
        className={cn(
          "h-[85vh] max-h-[85vh] overflow-hidden",
          "w-full max-w-full", // Ancho completo sin restricciones
          "flex flex-col p-0 m-0", // Sin padding ni margin
          "rounded-t-2xl", // Border radius superior para bottom sheet
          MOBILE_SAFE_AREAS.BOTTOM, // Safe area iOS
          isDragging && "transition-none" // Desactivar transición durante drag
        )}
        style={{
          transform: isDragging && translateY !== 0 ? `translateY(${translateY}px)` : undefined,
        }}
      >
        <SheetHeader className="sr-only">
          <SheetTitle>Navegación</SheetTitle>
          <SheetDescription>Menú de navegación completo</SheetDescription>
        </SheetHeader>

        {/* Barra indicadora para drag - Fija arriba */}
        <div 
          ref={dragHandleRef}
          data-drag-handle="true"
          {...dragHandlers}
          className={cn(
            "flex-shrink-0 flex items-center justify-center pt-3 pb-2",
            "cursor-grab active:cursor-grabbing",
            "touch-none", // Prevenir scroll durante drag
            isDragging && "cursor-grabbing"
          )}
          style={{ touchAction: 'none' }} // Solo drag, no scroll
        >
          <div className="w-12 h-1 rounded-full bg-muted-foreground/30" />
        </div>

        {/* Contenido del Sheet - AppSwitcher fijo + resto scrollable */}
        {/* Envolver en SidebarProvider para que AppSwitcher funcione */}
        <SidebarProvider>
          <div className="flex flex-col h-full min-h-0 overflow-hidden w-full">
            {/* Header - AppSwitcher FIJO */}
            {apps && apps.length > 0 && (
              <div className="flex-shrink-0 border-b p-3 w-full">
                <AppSwitcher apps={apps} loading={loading} />
              </div>
            )}

            {/* Contenedor scrollable con el resto del contenido */}
            <div 
              data-scrollable="true"
              className="flex-1 min-h-0 overflow-y-auto w-full pb-24"
            >
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
                  <div className="px-2 pb-24 mb-8 w-full">
                    <NavMain items={activeNavigationItems} />
                  </div>
                </>
              )}
            </div>
          </div>
        </SidebarProvider>
        
      </SheetContent>
    </Sheet>
  );
}
