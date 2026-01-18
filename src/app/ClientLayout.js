"use client";

import { Toaster } from "react-hot-toast";
import { SessionProvider } from "next-auth/react";
import { useEffect } from "react";
import AuthErrorInterceptor from "@/components/Utilities/AuthErrorInterceptor";
import { OptionsProvider } from "@/context/OptionsContext";
import { SettingsProvider } from "@/context/SettingsContext";
import { ThemeProvider } from "@/components/Providers/ThemeProvider";
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
      <SessionProvider>
        <SettingsProvider>
          <OptionsProvider>
            <AuthErrorInterceptor />
            {children}
            <Toaster />
            {/* Install Prompt Banner - Mobile */}
            <InstallPromptBanner />
          </OptionsProvider>
        </SettingsProvider>
      </SessionProvider>
    </ThemeProvider>
  );
}
