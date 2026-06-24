'use client';

import Link from 'next/link';
import { TriangleAlert } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useCompanySetupCheck } from '@/hooks/useCompanySetupCheck';

export function CompanySetupAlert() {
  const { isIncomplete, missingFields, isLoading } = useCompanySetupCheck();

  if (isLoading || !isIncomplete) return null;

  return (
    <Alert className="border-amber-500/40 bg-amber-50 dark:bg-amber-950/20">
      <TriangleAlert className="h-4 w-4 text-amber-500" />
      <AlertTitle className="text-amber-700 dark:text-amber-400">
        Datos de empresa incompletos
      </AlertTitle>
      <AlertDescription className="flex items-start justify-between gap-4">
        <span className="text-sm text-amber-600 dark:text-amber-300">
          Faltan campos obligatorios:{' '}
          {missingFields.map((f) => f.label).join(', ')}.
        </span>
        <Button variant="outline" size="sm" asChild className="shrink-0">
          <Link href="/admin/settings">Completar ahora</Link>
        </Button>
      </AlertDescription>
    </Alert>
  );
}
