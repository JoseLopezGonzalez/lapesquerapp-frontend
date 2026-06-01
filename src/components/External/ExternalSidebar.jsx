'use client';

import * as React from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar';
import { AppSwitcher } from '@/components/Admin/Layout/SideBar/app-switcher';
import { ExternalNavUser } from '@/components/External/ExternalNavUser';
import { isActiveRoute } from '@/utils/navigationUtils';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

export function ExternalSidebar({ user, apps = [], navigationItems = [] }) {
  const pathname = usePathname();

  const activeNavigationItems = React.useMemo(
    () =>
      navigationItems.map((item) => ({
        ...item,
        current: isActiveRoute(item.href, pathname),
      })),
    [navigationItems, pathname]
  );

  return (
    <Sidebar collapsible="icon" variant="floating">
      <SidebarHeader>
        <AppSwitcher apps={apps} loading={false} />
      </SidebarHeader>

      <SidebarContent className="min-h-0">
        <SidebarGroup>
          <SidebarGroupLabel>Espacio externo</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {activeNavigationItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={item.current}>
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.name}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-2 group-data-[collapsible=icon]:hidden">
          <SidebarGroupLabel>Acceso</SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="border-sidebar-border bg-sidebar-accent/40 space-y-3 rounded-xl border p-3">
              <div className="space-y-1">
                <p className="text-sidebar-foreground text-sm font-medium">Vista externa</p>
                <p className="text-sidebar-foreground/70 text-xs leading-5">
                  Solo ves y gestionas los almacenes asignados a tu cuenta. La navegación y las
                  acciones disponibles están limitadas.
                </p>
              </div>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <ExternalNavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
