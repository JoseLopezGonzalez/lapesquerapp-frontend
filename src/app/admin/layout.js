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
  // Solo items principales sin childrens (rutas directas)
  const bottomNavItems = React.useMemo(() => {
    const primaryItems = filteredNavigationConfig
      .filter((item) => !item.childrens || item.childrens.length === 0)
      .slice(0, 4); // Máximo 4 items principales

    // Si hay un item "Stores" con childrens, usar el primer children (Todos los Almacenes)
    const storesItem = filteredNavigationConfig.find(
      (item) => item.name === 'Almacenes' && item.childrens?.length > 0
    );
    if (storesItem && storesItem.childrens?.[0]) {
      const storesMain = {
        ...storesItem.childrens[0],
        icon: storesItem.icon,
        name: storesItem.name, // Mantener nombre "Almacenes"
      };
      
      // Reemplazar o añadir "Almacenes" en los items principales
      const filtered = primaryItems.filter((item) => item.name !== 'Almacenes');
      return [primaryItems[0], storesMain, ...filtered.slice(1)].slice(0, 4);
    }

    return primaryItems;
  }, [filteredNavigationConfig]);

  // Preparar user object para TopBar
  const user = React.useMemo(() => ({
    name: username,
    email: email,
    logout: handleLogout,
  }), [username, email, handleLogout]);

  // Placeholder para onMenuClick (Sheet se añadirá después)
  const handleMenuClick = React.useCallback(() => {
    // TODO: Abrir Sheet con navegación completa
    console.log('Menu click - Sheet pendiente de implementar');
  }, []);

  return (
    <AdminRouteProtection>
      <ResponsiveLayout
        bottomNavItems={bottomNavItems}
        user={user}
        onMenuClick={handleMenuClick}
      >
        {children}
      </ResponsiveLayout>
    </AdminRouteProtection>
  );
}
