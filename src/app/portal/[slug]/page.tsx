'use client';

import { use, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import LoginPage from '@/components/LoginPage';
import Loader from '@/components/Utilities/Loader';
import { getDefaultAuthenticatedRoute } from '@/lib/auth/actor';

interface TollClientLoginPageProps {
  params: Promise<{ slug: string }>;
}

/**
 * Login del portal de cliente de maquila, con branding propio por slug
 * (ver docs/maquila/frontend/00-index.md §1.2). Mismo flujo de auth (magic-link/OTP) que el
 * resto de la app — este componente solo decide qué branding mostrar antes de autenticar.
 */
export default function TollClientLoginPage({ params }: TollClientLoginPageProps) {
  const { slug } = use(params);
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      router.replace(getDefaultAuthenticatedRoute(session.user));
    }
  }, [status, session, router]);

  if (status === 'authenticated') {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader />
      </div>
    );
  }

  return <LoginPage tollClientSlug={slug} />;
}
