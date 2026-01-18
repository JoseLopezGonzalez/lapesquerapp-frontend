"use client";

import * as React from "react";
import { useSession, signOut } from "next-auth/react";
import toast from "react-hot-toast";
import { getToastTheme } from "@/customs/reactHotToast";
import AdminRouteProtection from '@/components/AdminRouteProtection';
import { ResponsiveLayout } from '@/components/Admin/Layout/ResponsiveLayout';
import { navigationConfig, navigationManagerConfig } from "@/configs/navgationConfig";
import { useSettings } from '@/context/SettingsContext';
import { filterNavigationByRoles } from "@/utils/navigationUtils";

export default function AdminLayout({ children }) {
  const { data: session } = useSession();
  const userRoles = session?.user?.role || [];
  const roles = Array.isArray(userRoles) ? userRoles : [userRoles];
  
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
      window.location.href = '/';
      toast.success('Sesión cerrada correctamente', getToastTheme());
    } catch (err) {
      // Incluso si falla el logout del backend, continuar con el logout del cliente
      await signOut({ redirect: false });
      window.location.href = '/';
      toast.success('Sesión cerrada correctamente', getToastTheme());
    }
  }, []);

  // Filtrar navegación por roles
  const filteredNavigationConfig = React.useMemo(() => 
    filterNavigationByRoles(navigationConfig, roles),
    [roles]
  );

  // Preparar items principales para BottomNav
  // Solo items principales sin childrens (rutas directas) o con childrens (usar primer children)
  const bottomNavItems = React.useMemo(() => {
    // Filtrar items que tienen href o childrens, y asegurar href
    const itemsWithHref = filteredNavigationConfig
      .filter((item) => item && (item.href || item.childrens?.length > 0))
      .map((item) => ({
        ...item,
        href: item.href || item.childrens?.[0]?.href || '#',
      }))
      .filter((item) => item.href !== '#') // Excluir items sin href válido
      .slice(0, 4); // Máximo 4 items principales

    return itemsWithHref;
  }, [filteredNavigationConfig]);

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
