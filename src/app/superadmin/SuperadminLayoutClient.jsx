"use client";

import React, { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { SuperadminAuthProvider, useSuperadminAuth } from "@/context/SuperadminAuthContext";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  LayoutDashboard,
  Building2,
  LogOut,
  Menu,
  X,
  Fish,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/superadmin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/superadmin/tenants", label: "Tenants", icon: Building2 },
];

function SidebarContent({ onItemClick }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1 px-3 py-2">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive =
          item.href === "/superadmin"
            ? pathname === "/superadmin"
            : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onItemClick}
            className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              isActive
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function AuthenticatedLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, logout, token } = useSuperadminAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

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

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-60 md:flex-col border-r bg-card">
        <div className="flex h-14 items-center gap-2 border-b px-4">
          <Fish className="h-5 w-5 text-primary" />
          <span className="font-semibold text-sm">PesquerApp Admin</span>
        </div>
        <div className="flex-1 overflow-y-auto py-2">
          <SidebarContent />
        </div>
        <div className="border-t p-3">
          <div className="mb-2 truncate px-3 text-xs text-muted-foreground">
            {user?.name || user?.email || "Superadmin"}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-muted-foreground"
            onClick={logout}
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </Button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-60 flex-col border-r bg-card transition-transform md:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-14 items-center justify-between border-b px-4">
          <div className="flex items-center gap-2">
            <Fish className="h-5 w-5 text-primary" />
            <span className="font-semibold text-sm">PesquerApp Admin</span>
          </div>
          <button onClick={() => setMobileOpen(false)} className="text-muted-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto py-2">
          <SidebarContent onItemClick={() => setMobileOpen(false)} />
        </div>
        <div className="border-t p-3">
          <div className="mb-2 truncate px-3 text-xs text-muted-foreground">
            {user?.name || user?.email || "Superadmin"}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-muted-foreground"
            onClick={logout}
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="flex h-14 items-center justify-between border-b px-4 md:hidden">
          <button onClick={() => setMobileOpen(true)} className="text-muted-foreground">
            <Menu className="h-5 w-5" />
          </button>
          <span className="text-sm font-semibold">PesquerApp Admin</span>
          <span className="text-xs text-muted-foreground truncate max-w-[100px]">
            {user?.name || ""}
          </span>
        </header>

        {/* Desktop header */}
        <header className="hidden md:flex h-14 items-center justify-end border-b px-6">
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              {user?.name || user?.email || ""}
            </span>
            <Button variant="ghost" size="sm" onClick={logout} className="gap-2">
              <LogOut className="h-4 w-4" />
              Cerrar sesión
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
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
