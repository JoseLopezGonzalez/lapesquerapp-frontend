"use client";

import { createPortal } from "react-dom";
import { SessionProvider } from "next-auth/react";
import { useEffect, useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { getQueryClient } from "@/lib/queryClient";
import AuthErrorInterceptor from "@/components/Utilities/AuthErrorInterceptor";
import { SettingsProvider } from "@/context/SettingsContext";
import { LogoutProvider } from "@/context/LogoutContext";
import { ThemeProvider } from "@/components/Providers/ThemeProvider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppToaster } from "@/components/ui/app-toaster";
import { registerServiceWorker } from "@/lib/sw-register";
import { InstallPromptBanner } from "@/components/PWA/InstallPromptBanner";

const TOASTER_PORTAL_STYLES = {
  position: "fixed",
  inset: 0,
  zIndex: 9999,
  pointerEvents: "none",
};

export default function ClientLayout({ children }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Registrar Service Worker solo en producción
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') {
      registerServiceWorker();
    }
  }, []);

  const toasterNode = mounted && typeof document !== "undefined"
    ? createPortal(
        <div style={TOASTER_PORTAL_STYLES}>
          <AppToaster />
        </div>,
        document.body
      )
    : null;

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <TooltipProvider delayDuration={0}>
        <QueryClientProvider client={getQueryClient()}>
          <SessionProvider>
            <SettingsProvider>
            <LogoutProvider>
              <AuthErrorInterceptor />
              {toasterNode}
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
