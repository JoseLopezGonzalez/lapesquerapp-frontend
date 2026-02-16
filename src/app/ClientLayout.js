"use client";

import { Toaster } from "sileo";
import "sileo/styles.css";
import { SessionProvider } from "next-auth/react";
import { useEffect } from "react";
import { useTheme } from "next-themes";
import { QueryClientProvider } from "@tanstack/react-query";
import { getQueryClient } from "@/lib/queryClient";
import AuthErrorInterceptor from "@/components/Utilities/AuthErrorInterceptor";
import { SettingsProvider } from "@/context/SettingsContext";
import { LogoutProvider } from "@/context/LogoutContext";
import { ThemeProvider } from "@/components/Providers/ThemeProvider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { registerServiceWorker } from "@/lib/sw-register";
import { InstallPromptBanner } from "@/components/PWA/InstallPromptBanner";

function SileoToaster() {
  const { resolvedTheme } = useTheme();
  // Doc Sileo: options son opcionales. Por defecto Sileo usa fill blanco.
  // Solo pasamos opciones en dark para que el toast se vea bien (fondo oscuro, texto claro).
  // En light no pasamos options y dejamos el control por defecto de Sileo.
  const options =
    resolvedTheme === "dark"
      ? {
          fill: "#171717",
          styles: {
            title: "!text-white",
            description: "!text-white/75",
          },
        }
      : undefined;

  return <Toaster position="top-center" offset={16} options={options} />;
}

export default function ClientLayout({ children }) {
  // Registrar Service Worker solo en producción
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') {
      registerServiceWorker();
    }
    
  }, []);

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <TooltipProvider delayDuration={0}>
        <QueryClientProvider client={getQueryClient()}>
          <SessionProvider>
            <SettingsProvider>
            <LogoutProvider>
              <AuthErrorInterceptor />
              {/* Toaster una vez (doc Sileo). Opciones según tema para no pisar el aspecto por defecto en light. */}
              <SileoToaster />
              {children}
              {/* Install Prompt Banner - Mobile */}
              <InstallPromptBanner />
            </LogoutProvider>
          </SettingsProvider>
          </SessionProvider>
        </QueryClientProvider>
      </TooltipProvider>
    </ThemeProvider>
  );
}
