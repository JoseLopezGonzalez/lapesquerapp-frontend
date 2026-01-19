"use client";

import LandingPage from "@/components/LandingPage";
import LoginPage from "@/components/LoginPage";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Loader from "@/components/Utilities/Loader";
import { LogoutDialog } from "@/components/Utilities/LogoutDialog";
import { useIsLoggingOut } from "@/hooks/useIsLoggingOut";

export default function HomePage() {
  // ✅ CRÍTICO: Todos los hooks DEBEN ejecutarse ANTES de cualquier return condicional
  // Esto es una regla fundamental de React Hooks
  const [isSubdomain, setIsSubdomain] = useState(null);
  const { data: session, status } = useSession();
  const router = useRouter();
  const isLoggingOut = useIsLoggingOut();

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
  
  // ✅ Verificar logout también en estados de carga (doble verificación)
  const checkLogoutFlag = () => {
    if (typeof sessionStorage !== 'undefined') {
      return sessionStorage.getItem('__is_logging_out__') === 'true';
    }
    return false;
  };
  
  // ✅ Estado local para forzar re-render cuando se limpia el flag
  const [logoutFlagCleared, setLogoutFlagCleared] = useState(() => {
    // Verificar si el flag ya fue limpiado al montar
    if (typeof sessionStorage !== 'undefined') {
      const hasFlag = sessionStorage.getItem('__is_logging_out__') === 'true';
      return !hasFlag;
    }
    return false;
  });
  
  // ✅ CRÍTICO: Limpiar el flag SOLO cuando status === "unauthenticated"
  // ❌ NUNCA limpiar mientras status === "loading"
  // El orden correcto es: signOut() → status="loading" → status="unauthenticated" → login listo
  useEffect(() => {
    if (typeof sessionStorage === 'undefined') return;
    
    const logoutFlag = sessionStorage.getItem('__is_logging_out__');
    
    // Debug: Log del estado actual
    console.log('🔍 Estado actual:', { 
      logoutFlag, 
      logoutFlagCleared, 
      status, 
      isSubdomain,
      pathname: typeof window !== 'undefined' ? window.location.pathname : 'N/A'
    });
    
    // ✅ REGLA DE ORO: Solo limpiar cuando status === "unauthenticated"
    // Esto asegura que NextAuth ya terminó de procesar el logout
    if (logoutFlag === 'true' && !logoutFlagCleared && status === 'unauthenticated' && isSubdomain === true) {
      console.log('🔄 Login listo (status=unauthenticated), limpiando flag...');
      
      // Usar requestAnimationFrame para dar tiempo al DOM de renderizar
      requestAnimationFrame(() => {
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.removeItem('__is_logging_out__');
          sessionStorage.removeItem('__is_logging_out_time__');
          console.log('✅ Flag de logout limpiado correctamente');
          setLogoutFlagCleared(true);
        }
      });
    } else if (logoutFlag !== 'true' && !logoutFlagCleared) {
      // Si el flag ya no existe (fue limpiado externamente), actualizar el estado
      console.log('✅ Flag ya no existe, actualizando estado');
      setLogoutFlagCleared(true);
    }
  }, [status, isSubdomain, logoutFlagCleared]);
  
  // ✅ Verificar periódicamente si el flag fue limpiado externamente (solo para detectar cambios)
  // NOTA: Esto NO limpia el flag, solo detecta si fue limpiado en otro lugar
  // ✅ OPTIMIZADO: Reducir frecuencia y solo verificar cuando sea necesario
  useEffect(() => {
    if (typeof sessionStorage === 'undefined' || logoutFlagCleared) return;
    
    const checkFlag = () => {
      const hasFlag = sessionStorage.getItem('__is_logging_out__') === 'true';
      if (!hasFlag && status !== 'loading') {
        // Solo actualizar si el flag fue removido Y no estamos en estado loading
        // Esto evita actualizar durante la transición crítica
        console.log('✅ Flag removido externamente detectado, actualizando estado');
        setLogoutFlagCleared(true);
      }
    };
    
    // Verificar inmediatamente
    checkFlag();
    
    // ✅ Reducir frecuencia a 500ms para evitar re-renders excesivos
    // Solo verificar si no estamos en estado loading
    if (status !== 'loading') {
      const interval = setInterval(checkFlag, 500); // Reducido de 100ms a 500ms
      return () => clearInterval(interval);
    }
  }, [logoutFlagCleared, status]);
  
  // ✅ AHORA SÍ: Después de todos los hooks, podemos hacer returns condicionales
  // ✅ PATRÓN CORRECTO: 1) Logout domina TODO, 2) Authenticated → Loader, 3) Todo lo demás → Login
  
  // 1️⃣ El logout domina TODO
  const hasLogoutFlag = checkLogoutFlag();
  const shouldShowLogout = !logoutFlagCleared && (isLoggingOut || hasLogoutFlag);
  
  if (shouldShowLogout) {
    return <LogoutDialog open={true} />;
  }

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
