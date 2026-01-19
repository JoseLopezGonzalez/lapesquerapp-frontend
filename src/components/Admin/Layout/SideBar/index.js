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
import { useAuthTransition } from '@/hooks/useAuthTransition';
import { AuthTransitionScreen } from '@/components/Auth/AuthTransitionScreen';


export function AppSidebar() {
    const currentPath = usePathname();
    const { data: session } = useSession();
    const userRoles = session?.user?.role || [];
    const roles = Array.isArray(userRoles) ? userRoles : [userRoles];

    const username = session?.user?.name || 'Desconocido';
    const email = session?.user?.email || 'Desconocido';

    const { settings, loading } = useSettings();
    const companyName = !loading && settings?.["company.name"] ? settings["company.name"] : "Empresa";
    
    const { showLogout } = useAuthTransition();

    const handleLogout = React.useCallback(async () => {
        // ✅ Activar transición INMEDIATAMENTE
        showLogout();
        
        try {
            // Primero revocar el token en el backend
            const { logout: logoutBackend } = await import('@/services/authService');
            await logoutBackend();
            
            // Luego cerrar sesión en NextAuth
            await signOut({ redirect: false });
            
            // ❌ NO usar toast - la transición lo reemplaza
            // toast.success('Sesión cerrada correctamente', getToastTheme()); // ELIMINAR
            
            // Redirigir después de un breve delay
            setTimeout(() => {
                window.location.replace('/');
            }, 800);
        } catch (err) {
            console.error('Error en logout:', err);
            // Incluso si falla el logout del backend, continuar con el logout del cliente
            await signOut({ redirect: false });
            // ❌ NO usar toast - la transición lo reemplaza
            // toast.success('Sesión cerrada correctamente', getToastTheme()); // ELIMINAR
            setTimeout(() => {
                window.location.replace('/');
            }, 800);
        }
    }, [showLogout]);

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
        <>
            {/* ✅ Pantalla de transición de autenticación */}
            <AuthTransitionScreen />
            
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
        </>
    )
}
