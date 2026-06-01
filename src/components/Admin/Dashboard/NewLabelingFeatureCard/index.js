'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';

export function NewLabelingFeatureCard() {
  return (
    <Card className="relative flex h-full justify-between overflow-hidden rounded-2xl border border-lime-200 bg-gradient-to-t from-lime-300 to-lime-100 p-4 shadow-sm dark:border-neutral-700 dark:from-neutral-800 dark:to-neutral-900">
      <div className="z-10">
        <CardHeader className="p-0 pb-2">
          <CardDescription className="flex items-center gap-1">
            <Sparkles className="h-4 w-4 text-yellow-500" />
            Nueva Funcionalidad
          </CardDescription>
          <CardTitle>Editor de Etiquetas</CardTitle>
        </CardHeader>

        <CardFooter className="mt-1 max-w-[200px] flex-col items-start gap-3 border-0 bg-transparent p-0 text-sm">
          <p className="text-muted-foreground">
            Crea, personaliza e imprime etiquetas.{' '}
            {/* para tus productos de forma rápida y visual. */}
          </p>
        </CardFooter>
      </div>

      <div className="absolute right-0 bottom-0 h-full translate-x-1/3 overflow-hidden">
        <img
          src="/images/mockup-label.png"
          alt="Mockup Editor de Etiquetas"
          className="h-full max-h-[190px] cursor-pointer object-contain"
          onClick={() => (window.location.href = '/admin/label-editor')}
        />
      </div>
    </Card>
  );
}
