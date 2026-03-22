'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { EmptyState } from '@/components/Utilities/EmptyState';
import Loader from '@/components/Utilities/Loader';
import { useFieldRoutes } from '@/hooks/useFieldRoutes';
import { getFieldStatusLabel } from '@/components/Field/labels';
import { MapPinned, ArrowRight } from 'lucide-react';

function getProgress(route) {
  const stops = Array.isArray(route?.stops) ? route.stops : [];
  const completed = stops.filter((stop) => stop.status === 'completed').length;
  const skipped = stops.filter((stop) => stop.status === 'skipped').length;
  const processed = completed + skipped;
  const total = stops.length || 0;
  const percentage = total > 0 ? Math.round((processed / total) * 100) : 0;

  return {
    processed,
    total,
    percentage,
  };
}

function formatRouteDate(value) {
  if (!value) return 'Sin fecha';

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(parsed);
}

export default function FieldRoutesListPage() {
  const { data, isLoading, error } = useFieldRoutes({ perPage: 20 });
  const routes = data?.items ?? [];

  if (isLoading) {
    return <div className="flex flex-1 items-center justify-center"><Loader /></div>;
  }

  if (error) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <EmptyState
          icon={<MapPinned className="h-10 w-10 text-primary" />}
          title="No se pudieron cargar las rutas"
          description={error.message ?? 'Inténtalo de nuevo más tarde.'}
        />
      </div>
    );
  }

  if (routes.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <EmptyState
          icon={<MapPinned className="h-10 w-10 text-primary" />}
          title="Sin rutas asignadas"
          description="Cuando tengas rutas asignadas aparecerán aquí."
        />
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Mis rutas</h1>
        <p className="text-sm text-muted-foreground">Consulta y ejecuta las rutas que tienes asignadas.</p>
      </div>

      <div className="grid gap-4">
        {routes.map((route) => {
          const progress = getProgress(route);

          return (
          <Card key={route.id} className="border-border/70">
            <CardHeader className="gap-3">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{route.name}</CardTitle>
                  <CardDescription>{formatRouteDate(route.routeDate)}</CardDescription>
                  <CardDescription>{route.description || 'Ruta operativa'}</CardDescription>
                </div>
                <Badge variant="secondary">{getFieldStatusLabel(route.status || 'pending')}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-muted-foreground">Progreso</span>
                  <span className="font-medium text-foreground">
                    {progress.processed}/{progress.total}
                  </span>
                </div>
                <Progress value={progress.percentage} className="h-2" />
              </div>

              <div className="flex items-center justify-end">
                <Button asChild>
                  <Link href={`/field/rutas/${route.id}`}>
                    Abrir ruta
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )})}
      </div>
    </div>
  );
}
