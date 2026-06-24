'use client';

import Link from 'next/link';
import { TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useCompanySetupCheck } from '@/hooks/useCompanySetupCheck';

export function CompanySetupAlert() {
  const { isIncomplete, missingFields, isLoading } = useCompanySetupCheck();

  if (isLoading || !isIncomplete) return null;

  return (
    <div
      className={cn(
        'fixed right-4 bottom-4 z-50 w-96 rounded-xl border border-amber-200 bg-background shadow-2xl dark:border-amber-800/60',
        'animate-in slide-in-from-bottom duration-300'
      )}
    >
      <div className="p-5">
        <div className="mb-4 flex items-start gap-3">
          <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950/60">
            <TriangleAlert className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="min-w-0 flex-1 pt-0.5">
            <h3 className="mb-1 text-base font-semibold leading-tight text-foreground">
              Datos de empresa incompletos
            </h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Faltan: {missingFields.map((f) => f.label).join(', ')}.
            </p>
          </div>
        </div>
        <Button asChild size="default" className="h-10 w-full text-sm font-medium">
          <Link href="/admin/settings">Completar datos de empresa</Link>
        </Button>
      </div>
    </div>
  );
}
