"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { Home, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { notify } from "@/lib/notifications";

function getUserInitials(name) {
  if (!name) return "U";
  return name
    .split(" ")
    .map((chunk) => chunk[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function ExternalLayoutClient({ children }) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [logoError, setLogoError] = useState(false);

  const navigationItems = useMemo(
    () => [
      {
        href: "/external/stores-manager",
        label: "Almacenes",
        icon: Home,
      },
    ],
    []
  );

  const handleLogout = async () => {
    try {
      const { logout: logoutBackend } = await import("@/services/authService");
      await logoutBackend();
    } catch (error) {
      console.error("Error en logout del backend:", error);
    }

    await signOut({ redirect: false });
    notify.success({ title: "Sesión cerrada" });
    window.location.replace("/");
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-5">
            <div>
              <div className="text-xs uppercase tracking-[0.22em] text-slate-500">
                Acceso externo
              </div>
              <div className="text-lg font-semibold text-slate-900">
                {session?.user?.companyName || "PesquerApp"}
              </div>
            </div>

            <nav className="flex items-center gap-2">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm transition ${
                      isActive
                        ? "bg-slate-900 text-white"
                        : "text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden items-center gap-3 sm:flex">
              {session?.user?.companyLogoUrl && !logoError ? (
                <img
                  src={session.user.companyLogoUrl}
                  alt={session.user.companyName || "Logo empresa"}
                  className="h-10 w-auto rounded-md"
                  onError={() => setLogoError(true)}
                />
              ) : null}
              <div className="text-right">
                <div className="text-sm font-medium text-slate-900">
                  {session?.user?.name || "Usuario"}
                </div>
                <div className="text-xs text-slate-500">
                  {session?.user?.email || ""}
                </div>
              </div>
              <Avatar className="h-9 w-9 rounded-xl">
                <AvatarImage src={session?.user?.image || ""} alt={session?.user?.name || ""} />
                <AvatarFallback className="rounded-xl bg-slate-200 text-slate-700">
                  {getUserInitials(session?.user?.name)}
                </AvatarFallback>
              </Avatar>
            </div>

            <Button variant="outline" onClick={handleLogout} className="gap-2">
              <LogOut className="h-4 w-4" />
              Cerrar sesión
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
