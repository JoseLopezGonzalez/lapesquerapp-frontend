'use client';

import LoginPage from '@/components/LoginPage';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Loader from '@/components/Utilities/Loader';
import { baseDomain } from '@/configs/branding';
import { getDefaultAuthenticatedRoute } from '@/lib/auth/actor';

export default function HomePage() {
  // ✅ CRÍTICO: Todos los hooks DEBEN ejecutarse ANTES de cualquier return condicional
  // Esto es una regla fundamental de React Hooks
  const [isSubdomain, setIsSubdomain] = useState(null);
  const { data: session, status } = useSession();
  const router = useRouter();

  // ✅ Todos los useEffect también deben estar antes de cualquier return
  useEffect(() => {
    const hostname = window.location.hostname;

    // Sin subdominio → landing; con subdominio (ej. dev.localhost) → login
    const parts = hostname.split('.');
    const isLocal = hostname.includes('localhost') || hostname === '127.0.0.1';

    if (isLocal) {
      // Ej: localhost → landing; dev.localhost → login (tenant dev)
      setIsSubdomain(parts.length > 1 && parts[0] !== 'localhost');
    } else {
      const domain = baseDomain || 'example.com';
      if (!domain) {
        setIsSubdomain(false);
      } else if (hostname === domain || hostname === 'www.' + domain) {
        setIsSubdomain(false);
      } else if (hostname.endsWith('.' + domain)) {
        setIsSubdomain(true);
      } else {
        setIsSubdomain(false); // fallback
      }
    }
  }, []);

  useEffect(() => {
    if (isSubdomain && status === 'authenticated' && session?.user) {
      router.replace(getDefaultAuthenticatedRoute(session.user));
    }
  }, [isSubdomain, status, session, router]);

  // ✅ Si no hay logout, mostrar la página normalmente
  if (isSubdomain === null) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (isSubdomain) {
    // 2️⃣ Usuario autenticado → mostrar loader mientras redirige
    if (status === 'authenticated') {
      return (
        <div className="flex h-screen w-full items-center justify-center">
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

  // Dominio raíz: en producción (branding pesquerapp) el middleware ya reescribió esta
  // petición a /[locale] (home pública) antes de llegar aquí — esta rama solo se alcanza
  // en modo isGenericBranding (deploy white-label sin landing pública) o como fallback
  // defensivo si el middleware no llegó a interceptar la petición.
  return <div className="bg-background min-h-screen" />;
}
