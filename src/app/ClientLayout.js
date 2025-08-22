"use client";

import { Toaster } from "react-hot-toast";
import { SessionProvider } from "next-auth/react";
import AuthErrorInterceptor from "@/components/Utilities/AuthErrorInterceptor";

export default function ClientLayout({ children }) {
  return (
    <SessionProvider>
      <AuthErrorInterceptor />
      {children}
      <Toaster />
    </SessionProvider>
  );
}
