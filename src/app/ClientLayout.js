"use client";

import { createPortal } from "react-dom";
import { Toaster } from "sileo";
import "sileo/styles.css";
import { SessionProvider } from "next-auth/react";
import { useEffect, useState } from "react";
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
  // Como en la página de Sileo: light theme → toast negro; dark theme → toast blanco.
  // Doc Sileo: fill "black" = toast oscuro; styles sobrescriben title/description para contraste.
  const roundness = 12;
  const options =
    resolvedTheme === "light"
      ? {
          fill: "#171717",
          roundness,
          styles: {
            title: "!text-white",
            description: "!text-white/75",
          },
        }
      : {
          roundness,
          styles: {
            title: "!text-gray-900",
            description: "!text-gray-600",
          },
        };

  return <Toaster position="top-center" offset={16} options={options} />;
}

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
          <SileoToaster />
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
