"use client";

import LandingPage from "@/components/LandingPage";
import LoginPage from "@/components/LoginPage";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Loader from "@/components/Utilities/Loader";

export default function HomePage() {
  // ✅ CRÍTICO: Todos los hooks DEBEN ejecutarse ANTES de cualquier return condicional
  // Esto es una regla fundamental de React Hooks
  const [isSubdomain, setIsSubdomain] = useState(null);
  const { data: session, status } = useSession();
  const router = useRouter();

  // ✅ Todos los useEffect también deben estar antes de cualquier return
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
      const rawRole = session.user.role;
      const userRole = Array.isArray(rawRole) ? rawRole[0] : rawRole;
      if (userRole === "operario") {
        router.replace("/admin/home");
      } else {
        router.replace("/admin/home");
      }
    }
  }, [isSubdomain, status, session, router]);


  // ✅ Si no hay logout, mostrar la página normalmente
  if (isSubdomain === null) {
    return (
      <div className="flex justify-center items-center h-screen w-full">
        <Loader />
      </div>
    );
  }

  if (isSubdomain) {
    // 2️⃣ Usuario autenticado → mostrar loader mientras redirige
    if (status === "authenticated") {
      return (
        <div className="flex justify-center items-center h-screen w-full">
          <Loader />
        </div>
      );
    }
    
    // 3️⃣ TODO lo demás (loading + unauthenticated) → LOGIN
    // ❌ NO bloquear por status === "loading"
    // El login se puede renderizar aunque NextAuth esté resolviendo
    return (
      <div className="space-y-4">
        <LoginPage />
      </div>
    );
  }
  
  return <LandingPage />;
}
