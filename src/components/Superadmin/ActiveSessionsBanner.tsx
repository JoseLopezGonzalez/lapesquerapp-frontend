'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { fetchSuperadmin } from '@/lib/superadminApi';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Zap } from 'lucide-react';

export default function ActiveSessionsBanner() {
  const [total, setTotal] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchActive = useCallback(async () => {
    try {
      const res = await fetchSuperadmin('/impersonation/active');
      const json = await res.json();
      setTotal(json.total ?? json.data?.length ?? 0);
    } catch {
      /* silent */
    }
  }, []);

  useEffect(() => {
    fetchActive();
    intervalRef.current = setInterval(fetchActive, 30000);
    return () => clearInterval(intervalRef.current ?? undefined);
  }, [fetchActive]);

  if (total === 0) return null;

  return (
    <Alert className="border-orange-500/40 bg-orange-50 dark:bg-orange-950/20">
      <Zap className="h-4 w-4 text-orange-500" />
      <AlertTitle className="text-orange-700 dark:text-orange-400">
        {total} sesión{total !== 1 ? 'es' : ''} de impersonación activa{total !== 1 ? 's' : ''}
      </AlertTitle>
      <AlertDescription className="flex items-center justify-between">
        <span className="text-sm text-orange-600 dark:text-orange-300">
          Hay accesos directos a tenants en curso.
        </span>
        <Button variant="outline" size="sm" asChild className="mt-1">
          <Link href="/superadmin/impersonation">Ver y terminar</Link>
        </Button>
      </AlertDescription>
    </Alert>
  );
}
