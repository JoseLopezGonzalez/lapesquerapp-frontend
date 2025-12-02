"use client"

import * as React from "react"
import {
    AudioWaveform,
    BookOpen,
    Bot,
    Command,
    Earth,
    Frame,
    GalleryVerticalEnd,
    Map,
    PieChart,
    Settings2,
    SquareTerminal,
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
import { Skeleton } from '@/components/ui/skeleton';

// This is sample data.


export function AppSidebar() {

    const currentPath = usePathname();
    const { data: session } = useSession();
    const userRoles = session?.user?.role || []; // Roles del usuario actual
    const roles = Array.isArray(userRoles) ? userRoles : [userRoles]; // Normalizar roles como array


    const username = session?.user?.name || 'Desconocido'; // Nombre del usuario actual
    const email = session?.user?.email || 'Desconocido'; // Nombre del usuario actual

    const { settings, loading } = useSettings();
    const companyName = !loading && settings?.["company.name"] ? settings["company.name"] : "Empresa";
    // console.log('[Sidebar] settings:', settings);
    // console.log('[Sidebar] companyName:', companyName);

    const handleLogout = async () => {
        try {
            await signOut({ redirect: false });
            window.location.href = '/';
            toast.success('Sesión cerrada correctamente', getToastTheme());
        } catch (err) {
            toast.error(err.message || 'Error al cerrar sesión');
        }
    };

    const data = {
        user: {
            name: username,
            email: email,
            logout: handleLogout,
            /* avatar: "/avatars/shadcn.jpg", */
        },
        apps: [
            {
                name: companyName, // Siempre string
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
        navigationItems: navigationConfig.map((item) =>
            /* Add current */
            item.href === currentPath
                ? { ...item, current: true }
                : item
        ),
        navigationManagersItems: navigationManagerConfig.map((item) =>
            /* Add current */
            item.href === currentPath
                ? { ...item, current: true }
                : item
        ),
    }


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
