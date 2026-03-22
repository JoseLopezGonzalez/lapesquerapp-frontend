'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

export default function ErrorFieldOperatorNotLinked({ onRetry, isLoading = false }) {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-lg border-border/70 shadow-sm">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600">
            <AlertTriangle className="h-7 w-7" />
          </div>
          <CardTitle>Acceso operativo no activado</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-sm text-muted-foreground">
            Tu usuario tiene rol de reparto, pero todavía no tiene un operador de campo vinculado.
            Contacta con administración para activar tu acceso operativo.
          </p>
          <Button onClick={onRetry} disabled={isLoading} className="w-full justify-between">
            Recargar estado
            <RefreshCcw className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
