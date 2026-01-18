"use client";

import LandingPage from "@/components/LandingPage";
import LoginPage from "@/components/LoginPage";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Loader from "@/components/Utilities/Loader";
import { LogoutDialog } from "@/components/Utilities/LogoutDialog";

export default function HomePage() {
  const [isSubdomain, setIsSubdomain] = useState(null);
  const { data: session, status } = useSession();
  const router = useRouter();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  // Verificar si hay un logout en curso al cargar la página
  useEffect(() => {
    if (typeof sessionStorage !== 'undefined') {
      const logoutFlag = sessionStorage.getItem('__is_logging_out__');
      if (logoutFlag === 'true') {
        setIsLoggingOut(true);
        setShowLogoutDialog(true);
        // Cerrar el diálogo después de un momento cuando la página de login esté lista
        const timer = setTimeout(() => {
          sessionStorage.removeItem('__is_logging_out__');
          sessionStorage.removeItem('__is_logging_out_time__');
          setShowLogoutDialog(false);
          setIsLoggingOut(false);
        }, 600);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  useEffect(() => {
    const hostname = window.location.hostname;

    // Quita 'localhost' o cualquier dominio principal (incluyendo desarrollo local con subdominios)
    const parts = hostname.split(".");
    const isLocal = hostname.includes("localhost");

    if (isLocal) {
      // Ej: brisamar.localhost → ['brisamar', 'localhost']
      setIsSubdomain(parts.length > 1 && parts[0] !== "localhost");
    } else {
      const baseDomain = "lapesquerapp.es";
      if (hostname === baseDomain || hostname === "www." + baseDomain) {
        setIsSubdomain(false);
      } else if (hostname.endsWith("." + baseDomain)) {
        setIsSubdomain(true);
      } else {
        setIsSubdomain(false); // fallback
      }
    }
  }, []);

  useEffect(() => {
    if (isSubdomain && status === "authenticated" && session?.user) {
      // Normalizar roles del usuario a array
      const userRoles = Array.isArray(session.user.role) ? session.user.role : (session.user.role ? [session.user.role] : []);
      // Redirección específica para store_operator
      if (userRoles.includes("store_operator") && session.user.assignedStoreId) {
        router.replace(`/warehouse/${session.user.assignedStoreId}`);
      } else {
        router.replace("/admin/home");
      }
    }
  }, [isSubdomain, status, session, router]);

  // Si hay un logout en curso, mostrar solo el diálogo sin loaders
  if (isLoggingOut || showLogoutDialog) {
    return <LogoutDialog open={true} />;
  }

  if (isSubdomain === null) return (
    <div className="flex justify-center items-center h-screen w-full">
      <Loader />
    </div>
  )

  if (isSubdomain) {
    if (status === "loading") return (
      <div className="flex justify-center items-center h-screen w-full">
        <Loader />
      </div>
    )
    if (status === "authenticated") return (
      <div className="flex justify-center items-center h-screen w-full">
        <Loader />
      </div>
    ); 
    return (
      <div className="space-y-4">
        <LoginPage />
      </div>
    );
  }
  return <LandingPage />;
}
