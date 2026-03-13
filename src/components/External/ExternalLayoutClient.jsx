"use client";

import * as React from "react";
import { signOut, useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import {
  Building2,
  Warehouse,
} from "lucide-react";
import { NavigationSheet } from "@/components/Admin/Layout/NavigationSheet";
import { BottomNav } from "@/components/Admin/Layout/BottomNav";
import { ExternalSidebar } from "@/components/External/ExternalSidebar";
import { ExternalUserMenuDialog } from "@/components/External/ExternalUserMenuDialog";
import { useIsMobileSafe } from "@/hooks/use-mobile";
import { notify } from "@/lib/notifications";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

function ExternalLayoutContent({ children }) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const { isMobile, mounted } = useIsMobileSafe();
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const [userMenuOpen, setUserMenuOpen] = React.useState(false);
  const mainRef = React.useRef(null);

  const allowedStoreIds = React.useMemo(
    () =>
      Array.isArray(session?.user?.allowedStoreIds)
        ? session.user.allowedStoreIds
        : [],
    [session?.user?.allowedStoreIds]
  );

  const handleLogout = React.useCallback(async () => {
    try {
      const { logout: logoutBackend } = await import("@/services/authService");
      await logoutBackend();
    } catch (error) {
      console.error("Error en logout del backend:", error);
    }

    await signOut({ redirect: false });
    notify.success({ title: "Sesion cerrada" });
    window.location.replace("/");
  }, []);

  React.useEffect(() => {
    if (sheetOpen) {
      setSheetOpen(false);
    }
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  const navigationItems = React.useMemo(
    () => [
      {
        name: "Almacenes",
        href: "/external/stores-manager",
        icon: Warehouse,
      },
    ],
    []
  );

  const bottomNavItems = React.useMemo(
    () => [
      {
        name: "Almacenes",
        href: "/external/stores-manager",
        icon: Warehouse,
      },
    ],
    []
  );

  const user = React.useMemo(
    () => ({
      name: session?.user?.name || "Usuario externo",
      email: session?.user?.email || "",
      image: session?.user?.image || "",
      companyName: session?.user?.companyName || "PesquerApp",
      companyLogoUrl: session?.user?.companyLogoUrl || "",
      externalUserType: session?.user?.externalUserType || null,
      allowedStoreIds,
      logout: handleLogout,
    }),
    [allowedStoreIds, handleLogout, session]
  );

  const apps = React.useMemo(
    () => [
      {
        name: user.companyName,
        logo: Building2,
        description: "Acceso externo",
        current: true,
      },
    ],
    [user.companyName]
  );

  const styleSidebar = {
    "--sidebar-width": "18rem",
    "--sidebar-width-mobile": "18rem",
  };

  if (!mounted || !isMobile) {
    return (
      <div className="h-screen overflow-hidden bg-muted/30">
        <SidebarProvider className="h-full" style={styleSidebar}>
          <ExternalSidebar
            user={user}
            apps={apps}
            navigationItems={navigationItems}
          />
          <main className="flex h-full w-full flex-col min-h-0 overflow-hidden p-1">
            <div className="shrink-0 p-1">
              <SidebarTrigger />
            </div>
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-1">
              {children}
            </div>
          </main>
        </SidebarProvider>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative flex h-screen flex-col overflow-hidden bg-background"
      )}
      vaul-drawer-wrapper=""
    >
      <main
        ref={mainRef}
        className={cn(
          "relative w-full overflow-hidden",
          bottomNavItems.length > 0
            ? "h-[calc(100vh-5rem-env(safe-area-inset-bottom))]"
            : "flex-1 min-h-0"
        )}
      >
        <div className="h-full w-full">{children}</div>
      </main>

      <BottomNav
        items={bottomNavItems}
        sheetOpen={sheetOpen}
        onSheetOpenChange={setSheetOpen}
      />

      <ExternalUserMenuDialog
        open={userMenuOpen}
        onOpenChange={setUserMenuOpen}
        user={user}
      />

      <NavigationSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        navigationItems={navigationItems}
        navigationManagersItems={[]}
        apps={apps}
        user={user}
        onUserMenuOpen={() => {
          setSheetOpen(false);
          setUserMenuOpen(true);
        }}
      />
    </div>
  );
}

export default function ExternalLayoutClient({ children }) {
  return <ExternalLayoutContent>{children}</ExternalLayoutContent>;
}
