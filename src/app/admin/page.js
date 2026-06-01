'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LogoutAwareLoader } from '@/components/Utilities/LogoutAwareLoader';

export default function AdminPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/home');
  }, [router]);

  return (
    <LogoutAwareLoader>
      <div className="flex h-screen w-full items-center justify-center">
        <div className="flex flex-col items-center justify-center gap-2">
          <div className="border-primary h-8 w-8 animate-spin rounded-full border-b-2"></div>
          <p className="text-muted-foreground text-sm">Redirigiendo...</p>
        </div>
      </div>
    </LogoutAwareLoader>
  );
}
