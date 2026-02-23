"use client";

import React, { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { SuperadminAuthProvider, useSuperadminAuth } from "@/context/SuperadminAuthContext";
import { fetchSuperadmin } from "@/lib/superadminApi";
import { Skeleton } from "@/components/ui/skeleton";
import {
  LayoutDashboard,
  Building2,
  LogOut,
  Fish,
  ChevronsUpDown,
  History,
  Bell,
  Server,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/ui/theme-toggle";

const NAV_MAIN = [
  { href: "/superadmin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/superadmin/tenants", label: "Tenants", icon: Building2 },
];

const NAV_GESTION = [
  { href: "/superadmin/impersonation", label: "Impersonaciones", icon: History },
  { href: "/superadmin/alerts", label: "Alertas", icon: Bell, alertBadge: true },
];

const NAV_SISTEMA = [
  { href: "/superadmin/system", label: "Sistema", icon: Server },
];

function useAlertCounts() {
  const [counts, setCounts] = useState({ total: 0, hasCritical: false });
  const intervalRef = useRef(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await fetchSuperadmin("/alerts?resolved=false&per_page=100");
        const json = await res.json();
        const data = json.data || [];
        const total = json.meta?.total ?? data.length;
        const hasCritical = data.some((a) => a.severity === "critical");
        setCounts({ total, hasCritical });
      } catch { /* silent */ }
    };
    fetch();
    intervalRef.current = setInterval(fetch, 60000);
    return () => clearInterval(intervalRef.current);
  }, []);

  return counts;
}

function NavGroup({ items, pathname, alertCounts }) {
  return (
    <SidebarMenu>
      {items.map((item) => {
        const isActive =
          item.href === "/superadmin"
            ? pathname === "/superadmin"
            : pathname.startsWith(item.href);

        const badge = item.alertBadge && alertCounts.total > 0 ? alertCounts.total : null;
        const badgeColor = item.alertBadge
          ? alertCounts.hasCritical
            ? "bg-destructive text-destructive-foreground"
            : "bg-orange-500 text-white"
          : "";

        return (
          <SidebarMenuItem key={item.href}>
            <SidebarMenuButton asChild isActive={isActive} tooltip={item.label}>
              <Link href={item.href}>
                <item.icon />
                <span>{item.label}</span>
              </Link>
            </SidebarMenuButton>
            {badge !== null && (
              <SidebarMenuBadge className={badgeColor}>
                {badge}
              </SidebarMenuBadge>
            )}
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}

function SuperadminSidebar() {
  const pathname = usePathname();
  const { user, logout } = useSuperadminAuth();
  const { isMobile } = useSidebar();
  const alertCounts = useAlertCounts();

  const displayName = user?.name || user?.email || "Superadmin";
  const displayEmail = user?.email || "";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Sidebar collapsible="icon" variant="floating">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/superadmin">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Fish className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">PesquerApp</span>
                  <span className="truncate text-xs">Superadmin</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup className="pt-0">
          <NavGroup items={NAV_MAIN} pathname={pathname} alertCounts={alertCounts} />
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Gestion</SidebarGroupLabel>
          <NavGroup items={NAV_GESTION} pathname={pathname} alertCounts={alertCounts} />
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Sistema</SidebarGroupLabel>
          <NavGroup items={NAV_SISTEMA} pathname={pathname} alertCounts={alertCounts} />
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{displayName}</span>
                    <span className="truncate text-xs">{displayEmail}</span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side={isMobile ? "bottom" : "right"}
                align="end"
                sideOffset={4}
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">{displayName}</span>
                      <span className="truncate text-xs">{displayEmail}</span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="focus:bg-transparent hover:bg-transparent"
                  onSelect={(e) => e.preventDefault()}
                >
                  <span>Tema</span>
                  <ThemeToggle className="ml-auto" />
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="cursor-pointer">
                  <LogOut />
                  Cerrar sesion
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}

function AuthenticatedLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { loading, token } = useSuperadminAuth();

  const isLoginPage = pathname === "/superadmin/login";
  if (isLoginPage) return <>{children}</>;

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
    );
  }

  if (!token) {
    router.replace("/superadmin/login");
    return null;
  }

  const styleSidebar = {
    "--sidebar-width": "16rem",
    "--sidebar-width-mobile": "16rem",
  };

  return (
    <div className="h-screen overflow-hidden">
      <SidebarProvider className="h-full" style={styleSidebar}>
        <SuperadminSidebar />
        <main className="flex flex-col h-full overflow-hidden w-full p-2">
          <div className="p-1">
            <SidebarTrigger />
          </div>
          <div className="flex-1 w-full h-full overflow-y-auto p-2">
            {children}
          </div>
        </main>
      </SidebarProvider>
    </div>
  );
}

export default function SuperadminLayoutClient({ children }) {
  return (
    <SuperadminAuthProvider>
      <AuthenticatedLayout>{children}</AuthenticatedLayout>
    </SuperadminAuthProvider>
  );
}
