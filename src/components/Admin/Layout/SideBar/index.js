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
        try {
            await signOut({ redirect: false });
            window.location.href = '/';
            toast.success('Sesión cerrada correctamente', getToastTheme());
        } catch (err) {
            toast.error(err.message || 'Error al cerrar sesión', getToastTheme());
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
            <SidebarContent>
                <NavManagers items={data.navigationManagersItems} />
                <NavMain items={data.navigationItems} />
            </SidebarContent>
            <SidebarFooter>
                <NavUser user={data.user} />
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    )
}
