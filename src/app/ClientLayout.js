"use client";

import { Toaster } from "react-hot-toast";
import { SessionProvider } from "next-auth/react";
import { useEffect } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { getQueryClient } from "@/lib/queryClient";
import AuthErrorInterceptor from "@/components/Utilities/AuthErrorInterceptor";
import { SettingsProvider } from "@/context/SettingsContext";
import { LogoutProvider } from "@/context/LogoutContext";
import { ThemeProvider } from "@/components/Providers/ThemeProvider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { registerServiceWorker } from "@/lib/sw-register";
import { InstallPromptBanner } from "@/components/PWA/InstallPromptBanner";

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
              {children}
              <Toaster />
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
