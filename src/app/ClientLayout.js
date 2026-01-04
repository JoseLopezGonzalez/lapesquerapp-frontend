"use client";

import { Toaster } from "react-hot-toast";
import { SessionProvider } from "next-auth/react";
import AuthErrorInterceptor from "@/components/Utilities/AuthErrorInterceptor";
import { OptionsProvider } from "@/context/OptionsContext";
import { ThemeProvider } from "@/components/Providers/ThemeProvider";

export default function ClientLayout({ children }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <SessionProvider>
        <OptionsProvider>
          <AuthErrorInterceptor />
          {children}
          <Toaster />
        </OptionsProvider>
      </SessionProvider>
    </ThemeProvider>
  );
}
