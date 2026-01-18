"use client"

import * as React from "react"
import {
    AudioWaveform,
    Earth,
    GalleryVerticalEnd,
} from "lucide-react"

import { NavMain } from "./nav-main"
import { NavManagers } from "./nav-managers"
import { NavUser } from "./nav-user"
import { AppSwitcher } from "./app-switcher"
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarRail,
    SidebarGroupLabel,
} from "@/components/ui/sidebar"

import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import { getToastTheme } from "@/customs/reactHotToast"
import { navigationConfig, navigationManagerConfig } from "@/configs/navgationConfig"
import { useSettings } from '@/context/SettingsContext';
import { filterNavigationByRoles, isActiveRoute } from "@/utils/navigationUtils"


export function AppSidebar() {
    const currentPath = usePathname();
    const { data: session } = useSession();
    const userRoles = session?.user?.role || [];
    const roles = Array.isArray(userRoles) ? userRoles : [userRoles];

    const username = session?.user?.name || 'Desconocido';
    const email = session?.user?.email || 'Desconocido';

    const { settings, loading } = useSettings();
    const companyName = !loading && settings?.["company.name"] ? settings["company.name"] : "Empresa";

    const handleLogout = React.useCallback(async () => {
        // Prevenir múltiples ejecuciones simultáneas
        if (sessionStorage.getItem('__is_logging_out__') === 'true') {
            return;
        }
        
        try {
            // Marcar que se está ejecutando un logout
            sessionStorage.setItem('__is_logging_out__', 'true');
            
            // Primero revocar el token en el backend
            const { logout: logoutBackend } = await import('@/services/authService');
            await logoutBackend();
            
            // Luego cerrar sesión en NextAuth
            await signOut({ redirect: false });
            
            // Limpiar la bandera antes de redirigir
            sessionStorage.removeItem('__is_logging_out__');
            
            // Mostrar mensaje y redirigir
            toast.success('Sesión cerrada correctamente', getToastTheme());
            window.location.href = '/';
        } catch (err) {
            // Incluso si falla el logout del backend, continuar con el logout del cliente
            await signOut({ redirect: false });
            
            // Limpiar la bandera antes de redirigir
            sessionStorage.removeItem('__is_logging_out__');
            
            // Mostrar mensaje y redirigir
            toast.success('Sesión cerrada correctamente', getToastTheme());
            window.location.href = '/';
        }
    }, []);

    // Filtrar navegación por roles
    const filteredNavigationConfig = React.useMemo(() => 
        filterNavigationByRoles(navigationConfig, roles),
        [roles]
    );

    const filteredNavigationManagerConfig = React.useMemo(() => 
        filterNavigationByRoles(navigationManagerConfig, roles),
        [roles]
    );

    // Marcar rutas activas y preparar datos
    const data = React.useMemo(() => ({
        user: {
            name: username,
            email: email,
            logout: handleLogout,
        },
        apps: [
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
        ],
        navigationItems: filteredNavigationConfig.map((item) =>
            isActiveRoute(item.href, currentPath)
                ? { ...item, current: true }
                : item
        ),
        navigationManagersItems: filteredNavigationManagerConfig.map((item) =>
            isActiveRoute(item.href, currentPath)
                ? { ...item, current: true }
                : item
        ),
    }), [username, email, handleLogout, companyName, filteredNavigationConfig, filteredNavigationManagerConfig, currentPath]);


    return (
        <Sidebar collapsible="icon" variant='floating'>
            <SidebarHeader>
                <AppSwitcher apps={data.apps} loading={loading} />
            </SidebarHeader>
            <SidebarContent className="flex flex-col min-h-0">
                <div className="flex-shrink-0">
                    <NavManagers items={data.navigationManagersItems} />
                </div>
                <div className="flex flex-col flex-1 min-h-0">
                    <div className="flex-shrink-0">
                        <SidebarGroupLabel>Navegación</SidebarGroupLabel>
                    </div>
                    <div className="flex-1 min-h-0 overflow-y-auto">
                        <NavMain items={data.navigationItems} />
                    </div>
                </div>
            </SidebarContent>
            <SidebarFooter className="mt-4">
                <NavUser user={data.user} />
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    )
}
