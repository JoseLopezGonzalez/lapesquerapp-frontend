'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/Utilities/EmptyState';
import Loader from '@/components/Utilities/Loader';
import { useFieldRoutes } from '@/hooks/useFieldRoutes';
import { getFieldStatusLabel } from '@/components/Field/labels';
import { MapPinned, ArrowRight } from 'lucide-react';

function getProgress(route) {
  const stops = Array.isArray(route?.stops) ? route.stops : [];
  const completed = stops.filter((stop) => stop.status === 'completed').length;
  const skipped = stops.filter((stop) => stop.status === 'skipped').length;
  return `${completed + skipped}/${stops.length || 0}`;
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
        {routes.map((route) => (
          <Card key={route.id} className="border-border/70">
            <CardHeader className="gap-3">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{route.name}</CardTitle>
                  <CardDescription>
                    {route.routeDate || 'Sin fecha'} · {route.fieldOperator?.name || 'Sin repartidor'}
                  </CardDescription>
                </div>
                <Badge variant="secondary">{getFieldStatusLabel(route.status || 'pending')}</Badge>
              </div>
            </CardHeader>
            <CardContent className="flex items-center justify-between gap-3">
              <div className="text-sm text-muted-foreground">
                Progreso: <span className="font-medium text-foreground">{getProgress(route)}</span>
              </div>
              <Button asChild>
                <Link href={`/field/rutas/${route.id}`}>
                  Abrir ruta
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
