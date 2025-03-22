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
import { darkToastTheme } from "@/customs/reactHotToast"
import { navigationConfig, navigationManagerConfig } from "@/configs/navgationConfig"

// This is sample data.


export function AppSidebar() {

    const currentPath = usePathname();
    const { data: session } = useSession();
    const userRoles = session?.user?.role || []; // Roles del usuario actual
    const roles = Array.isArray(userRoles) ? userRoles : [userRoles]; // Normalizar roles como array

    console.log(session?.user)

    const username = session?.user?.name || 'Desconocido'; // Nombre del usuario actual
    const email = session?.user?.email || 'Desconocido'; // Nombre del usuario actual

    const handleLogout = async () => {
        try {
            await signOut({ redirect: false });
            window.location.href = '/login';
            toast.success('Sesión cerrada correctamente', darkToastTheme);
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
                name: "Congelados Brisamar S.L.",
                logo: GalleryVerticalEnd,
                description: "Administración",
                current: true,
            },
            {
                name: "Congelados Brisamar S.L.",
                logo: AudioWaveform,
                description: "Producción",
                current: false,
            },
            {
                name: "Congelados Brisamar S.L.",
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
        <Sidebar collapsible="icon" variant='floating'
           >
            <SidebarHeader>
                <AppSwitcher apps={data.apps} />
            </SidebarHeader>
            <SidebarContent>
                <NavMain items={data.navigationItems} />
                <NavManagers items={data.navigationManagersItems} />
            </SidebarContent>
            <SidebarFooter>
                <NavUser user={data.user} />
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    )
}
