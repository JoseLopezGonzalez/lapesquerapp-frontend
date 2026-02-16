"use client";

import * as React from "react";
import { useSession, signOut } from "next-auth/react";import AdminRouteProtection from '@/components/AdminRouteProtection';
import { ResponsiveLayout } from '@/components/Admin/Layout/ResponsiveLayout';
import { navigationConfig, navigationManagerConfig } from "@/configs/navgationConfig";
import { useSettings } from '@/context/SettingsContext';
import { filterNavigationByRoles } from "@/utils/navigationUtils";
import { notify } from "@/lib/notifications";
import { MessageSquare } from "lucide-react";

export default function AdminLayoutClient({ children }) {
  const { data: session } = useSession();
  const rawRole = session?.user?.role;
  const roles = Array.isArray(rawRole) ? rawRole.filter(Boolean) : (rawRole ? [rawRole] : []);
  
  const username = session?.user?.name || 'Desconocido';
  const email = session?.user?.email || 'Desconocido';

  const { settings, loading } = useSettings();

  const handleLogout = React.useCallback(async () => {
    try {
      // Primero revocar el token en el backend
      const { logout: logoutBackend } = await import('@/services/authService');
      await logoutBackend();
      
      // Luego cerrar sesión en NextAuth
      await signOut({ redirect: false });
      
      // Mostrar toast de éxito
      notify.success('Sesión cerrada correctamente');
      
      // Redirigir después de un breve delay para que se vea el toast
      setTimeout(() => {
        window.location.replace('/');
      }, 500);
    } catch (err) {
      console.error('Error en logout:', err);
      // Incluso si falla el logout del backend, continuar con el logout del cliente
      await signOut({ redirect: false });
      notify.success('Sesión cerrada correctamente');
      setTimeout(() => {
        window.location.replace('/');
      }, 500);
    }
  }, []);

  // Filtrar navegación por roles
  const filteredNavigationConfig = React.useMemo(() => 
    filterNavigationByRoles(navigationConfig, roles),
    [roles]
  );

  // Preparar items principales para BottomNav
  // Items específicos según requerimientos: Inicio, Gestor de pedidos, Almacenes interactivos, Chat IA
  const bottomNavItems = React.useMemo(() => {
    // 1. Inicio - de navigationConfig
    const inicioItem = filteredNavigationConfig.find((item) => item.href === '/admin/home');
    
    // 2. Gestor de pedidos - de navigationManagerConfig (con nombre corto)
    const filteredManagers = filterNavigationByRoles(navigationManagerConfig, roles);
    const gestorPedidosItem = filteredManagers.find(
      (item) => item.href === '/admin/orders-manager'
    );
    if (gestorPedidosItem) {
      gestorPedidosItem.name = 'Pedidos'; // Nombre corto para BottomNav
    }
    
    // 3. Almacenes interactivos - de navigationManagerConfig (con nombre corto)
    const almacenesInteractivosItem = filteredManagers.find(
      (item) => item.href === '/admin/stores-manager'
    );
    if (almacenesInteractivosItem) {
      almacenesInteractivosItem.name = 'Almacenes'; // Nombre corto para BottomNav
    }
    
    // 4. Chat IA - Item especial con onClick (no tiene href)
    const chatIAItem = {
      name: 'Chat IA',
      icon: MessageSquare,
      href: null, // No es una ruta, es una acción
    };

    // Construir array final, filtrando items que no existen (Cuenta va en el sheet del menú)
    const items = [
      inicioItem,
      gestorPedidosItem,
      almacenesInteractivosItem,
      chatIAItem,
    ].filter((item) => item !== undefined && item !== null);
    
    return items;
  }, [filteredNavigationConfig, roles]);

  // Preparar user object para TopBar
  const user = React.useMemo(() => ({
    name: username,
    email: email,
    logout: handleLogout,
  }), [username, email, handleLogout]);

  // Preparar navigation items con rutas activas
  // Filtrar items que no tienen href ni childrens, y asegurar href
  const navigationItems = React.useMemo(() => 
    filteredNavigationConfig
      .filter((item) => item && (item.href || item.childrens?.length > 0))
      .map((item) => ({
        ...item,
        href: item.href || item.childrens?.[0]?.href || '#'
      })),
    [filteredNavigationConfig]
  );

  const navigationManagersItems = React.useMemo(() => 
    filterNavigationByRoles(navigationManagerConfig, roles),
    [roles]
  );

  // Preparar apps para AppSwitcher
  const apps = React.useMemo(() => {
    const { GalleryVerticalEnd, AudioWaveform, Earth } = require("lucide-react");
    const companyName = !loading && settings?.["company.name"] ? settings["company.name"] : "Empresa";
    
    return [
      {
        name: companyName,
        logo: GalleryVerticalEnd,
        description: "Administración",
        current: true,
      },
      {
        name: companyName,
        logo: AudioWaveform,
        description: "Producción",
        current: false,
      },
      {
        name: companyName,
        logo: Earth,
        description: "World Trade",
        current: false,
      },
    ];
  }, [settings, loading]);

  return (
    <AdminRouteProtection>
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
    </AdminRouteProtection>
  );
}
