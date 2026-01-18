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
import { TopBar } from "@/components/Admin/Layout/TopBar";
import { BottomNav } from "@/components/Admin/Layout/BottomNav";
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
  const { isMobile, mounted } = useIsMobileSafe();
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const pathname = usePathname();

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
    <div className="flex flex-col h-screen overflow-hidden">
      {/* TopBar */}
      <TopBar 
        onMenuClick={onMenuClick}
        sheetOpen={sheetOpen}
        onSheetOpenChange={setSheetOpen}
        user={user}
        navigationItems={navigationItems}
        navigationManagersItems={navigationManagersItems}
        apps={apps}
        loading={loading}
      />

      {/* Main Content - Scrollable */}
      <main
        className={cn(
          "flex-1 overflow-y-auto",
          "pt-16 pb-20", // Padding top (TopBar) + bottom (BottomNav)
          "w-full"
        )}
      >
        {children}
      </main>

      {/* BottomNav */}
      {bottomNavItems && bottomNavItems.length > 0 && (
        <BottomNav items={bottomNavItems} />
      )}
    </div>
  );
}

