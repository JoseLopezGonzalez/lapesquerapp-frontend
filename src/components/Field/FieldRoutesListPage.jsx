'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/Utilities/EmptyState';
import { useFieldRoutes } from '@/hooks/useFieldRoutes';
import { getFieldStatusLabel } from '@/components/Field/labels';
import { MapPinned, ArrowRight } from 'lucide-react';

const routeDateFormatter = new Intl.DateTimeFormat('es-ES', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
});

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

  return routeDateFormatter.format(parsed);
}

function FieldRoutesListSkeleton() {
  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div className="space-y-1">
        <Skeleton className="h-7 w-28" />
        <Skeleton className="h-4 w-56" />
      </div>
      <div className="grid gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="border-border/70">
            <CardHeader className="gap-3">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-2 w-full rounded-full" />
              <div className="flex justify-end">
                <Skeleton className="h-9 w-28 rounded-md" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function FieldRoutesListPage() {
  const { data, isLoading, errorMessage } = useFieldRoutes({ perPage: 20 });
  const routes = data?.items ?? [];

  if (isLoading) {
    return <FieldRoutesListSkeleton />;
  }

  if (errorMessage) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <EmptyState
          icon={<MapPinned className="text-primary h-10 w-10" />}
          title="No se pudieron cargar las rutas"
          description={errorMessage}
        />
      </div>
    );
  }

  if (routes.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <EmptyState
          icon={<MapPinned className="text-primary h-10 w-10" />}
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
        <p className="text-muted-foreground text-sm">
          Consulta y ejecuta las rutas que tienes asignadas.
        </p>
      </div>

      <ScrollArea className="h-full w-full">
        <div className="grid gap-4 pb-[calc(5rem+env(safe-area-inset-bottom))]">
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
                  <Badge variant="secondary">
                    {getFieldStatusLabel(route.status || 'pending')}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-muted-foreground">Progreso</span>
                    <span className="text-foreground font-medium">
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
          );
        })}
        </div>
      </ScrollArea>
    </div>
  );
}
