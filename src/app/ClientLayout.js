"use client";

import { Toaster } from "react-hot-toast";
import { SessionProvider } from "next-auth/react";
import { useEffect } from "react";
import AuthErrorInterceptor from "@/components/Utilities/AuthErrorInterceptor";
import { OptionsProvider } from "@/context/OptionsContext";
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
    
    // Limpiar banderas de logout bloqueadas al iniciar la aplicación
    if (typeof sessionStorage !== 'undefined') {
      const logoutFlag = sessionStorage.getItem('__is_logging_out__');
      if (logoutFlag === 'true') {
        const logoutTime = sessionStorage.getItem('__is_logging_out_time__');
        // Si hay una marca de hace más de 10 segundos, limpiarla (puede ser de un logout fallido)
        if (!logoutTime || Date.now() - parseInt(logoutTime) > 10000) {
          sessionStorage.removeItem('__is_logging_out__');
          sessionStorage.removeItem('__is_logging_out_time__');
          console.log('Banderas de logout bloqueadas limpiadas');
        }
      }
    }
  }, []);

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <TooltipProvider delayDuration={0}>
        <SessionProvider>
          <SettingsProvider>
            <OptionsProvider>
              <LogoutProvider>
                <AuthErrorInterceptor />
                {children}
                <Toaster />
                {/* Install Prompt Banner - Mobile */}
                <InstallPromptBanner />
              </LogoutProvider>
            </OptionsProvider>
          </SettingsProvider>
        </SessionProvider>
      </TooltipProvider>
    </ThemeProvider>
  );
}
