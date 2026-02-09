"use client";

/**
 * ResponsiveLayout - Wrapper que renderiza layout según dispositivo
 * 
 * Responsabilidad clara:
 * - Solo decide qué layout renderizar (desktop vs mobile)
 * - Solo decide qué navegación mostrar (Sidebar vs TopBar + BottomNav)
 * - Solo maneja safe areas estructurales
 * 
 * NO hace:
 * - Estilos visuales (eso lo hacen los componentes hijos)
 * - Lógica de negocio
 * - Gestión de estado compleja
 * 
 * Referencia: docs/mobile-adaptation/implementaciones/01-LAYOUT-NAVEGACION.md
 */

import * as React from "react";
import { usePathname } from "next/navigation";
import { useIsMobileSafe } from "@/hooks/use-mobile";
import { AppSidebar } from "@/components/Admin/Layout/SideBar";
import { BottomNav } from "@/components/Admin/Layout/BottomNav";
import { FloatingUserMenu } from "@/components/Admin/Layout/FloatingUserMenu";
import { NavigationSheet } from "@/components/Admin/Layout/NavigationSheet";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { BottomNavProvider, useBottomNav } from "@/context/BottomNavContext";
import { cn } from "@/lib/utils";

/**
 * ResponsiveLayout - Componente wrapper responsive
 * 
 * @param {object} props
 * @param {React.ReactNode} props.children - Contenido a renderizar
 * @param {Array} props.bottomNavItems - Items para BottomNav (solo mobile)
 * @param {object} props.user - Objeto usuario para TopBar y Sidebar
 * @param {Function} props.onMenuClick - Callback cuando se clickea menú en TopBar
 */
function ResponsiveLayoutContent({ 
  children, 
  bottomNavItems = [],
  user,
  onMenuClick,
  navigationItems = [],
  navigationManagersItems = [],
  apps = [],
  loading = false,
}) {
  // IMPORTANTE: Todos los hooks deben ejecutarse ANTES de cualquier return condicional
  const { isMobile, mounted } = useIsMobileSafe();
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const pathname = usePathname();
  const mainRef = React.useRef(null); // Mover ref fuera del bloque condicional
  const { hideBottomNav } = useBottomNav(); // Obtener estado del context

  // Cerrar Sheet automáticamente al navegar
  React.useEffect(() => {
    if (sheetOpen) {
      setSheetOpen(false);
    }
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  // Regla crítica: Mientras isMobile === null, NO renderizar navegación mobile
  // Renderizar layout desktop por defecto hasta que esté montado
  if (!mounted) {
    // Renderizar layout desktop por defecto (no afecta visualmente)
    const styleSidebar = {
      "--sidebar-width": "18rem",
      "--sidebar-width-mobile": "16rem",
    };
    
    return (
      <div className='h-screen overflow-hidden'>
        <SidebarProvider className='h-full' style={styleSidebar}>
          <AppSidebar />
          <main className='flex flex-col h-full overflow-hidden w-full p-2'>
            <div className='p-1'>
              <SidebarTrigger />
            </div>
            <div className='flex-1 w-full h-full overflow-hidden p-2'>
              {children}
            </div>
          </main>
        </SidebarProvider>
      </div>
    );
  }

  // Desktop layout (≥768px)
  if (!isMobile) {
    const styleSidebar = {
      "--sidebar-width": "18rem",
      "--sidebar-width-mobile": "16rem",
    };
    
    return (
      <div className='h-screen overflow-hidden'>
        <SidebarProvider className='h-full' style={styleSidebar}>
          <AppSidebar />
          <main className='flex flex-col h-full overflow-hidden w-full p-2'>
            <div className='p-1'>
              <SidebarTrigger />
            </div>
            <div className='flex-1 w-full h-full overflow-hidden p-2'>
              {children}
            </div>
          </main>
        </SidebarProvider>
      </div>
    );
  }

      // Mobile layout (<768px)
      return (
        <div 
          className={cn(
            "flex flex-col h-screen overflow-hidden relative",
            // Fondo sólido para que el efecto de escala de vaul sea visible
            "bg-background"
          )}
          vaul-drawer-wrapper=""
        >
          {/* Main Content - NO scrollable en mobile, cada componente gestiona su scroll */}
          {/* Altura ajustada restando el bottom nav si existe */}
          <main
            ref={mainRef}
            className={cn(
              "overflow-hidden", // overflow-hidden para que cada componente gestione su scroll
              "w-full relative", // relative para posicionar el avatar
              // Altura ajustada restando el bottom nav si existe y no está oculto
              // Bottom nav: pt-3 (12px) + contenido min-h-[44px] + pb-4 (16px) + safe area ≈ 72px + safe area
              // Usamos 5rem (80px) para dar margen extra y evitar que se corte el contenido
              bottomNavItems && bottomNavItems.length > 0 && !hideBottomNav
                ? "h-[calc(100vh-5rem-env(safe-area-inset-bottom))]" 
                : "flex-1 min-h-0"
            )}
          >
            {/* Wrapper del contenido con padding superior para el avatar */}
            <div className="relative w-full h-full">
              {/* Avatar de usuario flotante - Se mueve con el scroll */}
              {user && (
                <div className="absolute top-4 right-4 z-50 w-fit">
                  <FloatingUserMenu user={user} scrollContainerRef={mainRef} />
                </div>
              )}
              
              {/* Contenido principal - altura completa para que los hijos puedan usar h-full */}
              <div className="h-full w-full">
                {children}
              </div>
            </div>
          </main>

      {/* BottomNav - Solo mostrar si no está oculto por el context */}
      {bottomNavItems && bottomNavItems.length > 0 && !hideBottomNav && (
        <BottomNav 
          items={bottomNavItems}
          sheetOpen={sheetOpen}
          onSheetOpenChange={setSheetOpen}
        />
      )}

      {/* NavigationSheet - Sheet con navegación completa */}
      <NavigationSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        navigationItems={navigationItems}
        navigationManagersItems={navigationManagersItems}
        apps={apps}
        loading={loading}
      />
    </div>
  );
}

/**
 * ResponsiveLayout - Componente wrapper responsive con BottomNavProvider
 * 
 * @param {object} props
 * @param {React.ReactNode} props.children - Contenido a renderizar
 * @param {Array} props.bottomNavItems - Items para BottomNav (solo mobile)
 * @param {object} props.user - Objeto usuario para TopBar y Sidebar
 * @param {Function} props.onMenuClick - Callback cuando se clickea menú en TopBar
 */
export function ResponsiveLayout(props) {
  return (
    <BottomNavProvider>
      <ResponsiveLayoutContent {...props} />
    </BottomNavProvider>
  );
}
