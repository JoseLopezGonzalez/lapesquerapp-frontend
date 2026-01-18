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
export function ResponsiveLayout({ 
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
        <div className="flex flex-col h-screen overflow-hidden relative">
          {/* Main Content - Scrollable */}
          <main
            ref={mainRef}
            className={cn(
              "flex-1 overflow-y-auto", // Contenedor scrollable
              "pb-20", // Padding bottom (BottomNav)
              "w-full relative" // relative para posicionar el avatar
            )}
          >
            {/* Wrapper del contenido con padding superior para el avatar */}
            <div className="relative min-h-full">
              {/* Avatar de usuario flotante - Se mueve con el scroll */}
              {user && (
                <div className="absolute top-4 right-4 z-50 w-fit">
                  <FloatingUserMenu user={user} scrollContainerRef={mainRef} />
                </div>
              )}
              
              {/* Contenido principal con padding superior */}
              <div className="pt-4">
                {children}
              </div>
            </div>
          </main>

      {/* BottomNav */}
      {bottomNavItems && bottomNavItems.length > 0 && (
        <BottomNav 
          items={bottomNavItems}
          onSwipeUp={() => setSheetOpen(true)} // Abrir NavigationSheet al hacer swipe up
        />
      )}

      {/* NavigationSheet - Sheet con navegación completa */}
      <NavigationSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        user={user}
        navigationItems={navigationItems}
        navigationManagersItems={navigationManagersItems}
        apps={apps}
        loading={loading}
      />
    </div>
  );
}

