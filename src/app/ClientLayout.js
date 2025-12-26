"use client";

import { Toaster } from "react-hot-toast";
import { SessionProvider } from "next-auth/react";
import AuthErrorInterceptor from "@/components/Utilities/AuthErrorInterceptor";
import { OptionsProvider } from "@/context/OptionsContext";

export default function ClientLayout({ children }) {
  return (
    <SessionProvider>
      <OptionsProvider>
        <AuthErrorInterceptor />
        {children}
        <Toaster />
      </OptionsProvider>
    </SessionProvider>
  );
}
