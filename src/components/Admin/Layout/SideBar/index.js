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
import { signOut, useSession } from 'next-auth/react';import { navigationConfig, navigationManagerConfig } from "@/configs/navgationConfig"
import { useSettings } from '@/context/SettingsContext';
import { notify } from '@/lib/notifications';
import { filterNavigationByRoles, isActiveRoute } from "@/utils/navigationUtils"


export function AppSidebar() {
    const currentPath = usePathname();
    const { data: session } = useSession();
    const rawRole = session?.user?.role;
    const roles = Array.isArray(rawRole) ? rawRole.filter(Boolean) : (rawRole ? [rawRole] : []);

    const username = session?.user?.name || 'Desconocido';
    const email = session?.user?.email || 'Desconocido';

    const { settings, loading } = useSettings();
    const companyName = !loading && settings?.["company.name"] ? settings["company.name"] : "Empresa";

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
