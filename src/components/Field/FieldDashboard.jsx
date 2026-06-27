'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/Utilities/EmptyState';
import { useFieldOrders } from '@/hooks/useFieldOrders';
import { useFieldRoutes } from '@/hooks/useFieldRoutes';
import { getFieldStatusLabel } from '@/components/Field/labels';
import { MapPinned, PackageOpen, ShoppingCart, ArrowRight, Activity, Clock3 } from 'lucide-react';

function getGreeting() {
  const hour = new Date().getHours();

  if (hour >= 6 && hour < 12) {
    return 'Buenos días,';
  }
  if (hour >= 12 && hour < 20) {
    return 'Buenas tardes,';
  }
  return 'Buenas noches,';
}

function getTodayDateString() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function FieldDashboardSkeleton() {
  return (
    <div className="flex h-full min-h-0 flex-col gap-4 px-4 py-3">
      <ScrollArea className="h-full w-full pr-4">
        <div className="flex w-full flex-col gap-4 pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-4">
          <div className="mb-2 flex flex-col items-start justify-center gap-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-8 w-48" />
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="border-border/70">
                <CardHeader className="space-y-3">
                  <Skeleton className="h-12 w-12 rounded-2xl" />
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-28" />
                    <Skeleton className="h-4 w-44" />
                  </div>
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-[120px] w-full rounded-xl" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

export default function FieldDashboard() {
  const [greeting] = useState(() => getGreeting());
  const { data: session } = useSession();
  const userName = session?.user?.name || 'Usuario';
  const today = getTodayDateString();
  const { data: routesData, isLoading: loadingRoutes } = useFieldRoutes({
    routeDate: today,
    perPage: 5,
  });
  const { data: ordersData, isLoading: loadingOrders } = useFieldOrders({ perPage: 20 });

  const todayRoute = routesData?.items?.[0] ?? null;
  const orders = ordersData?.items ?? [];
  const pendingOrders = orders.filter((order) => order.status === 'pending').length;
  const finishedOrders = orders.filter((order) => order.status === 'finished').length;
  const routeStops = Array.isArray(todayRoute?.stops) ? todayRoute.stops : [];
  const completedStops = routeStops.filter((stop) => stop.status === 'completed').length;
  const skippedStops = routeStops.filter((stop) => stop.status === 'skipped').length;

  if (loadingRoutes || loadingOrders) {
    return <FieldDashboardSkeleton />;
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 px-4 py-3">
      <ScrollArea className="h-full w-full pr-4">
        <div className="flex w-full flex-col gap-4 pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-4">
          <div className="w-full">
            <div className="mb-2 flex flex-col items-start justify-center md:mb-4">
              <p className="text-lg text-neutral-500 dark:text-neutral-400">{greeting}</p>
              <h1 className="text-3xl font-light md:text-4xl">{userName}</h1>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-border/70 shadow-sm">
              <CardHeader className="space-y-3">
                <div className="bg-primary/10 text-primary flex h-12 w-12 items-center justify-center rounded-2xl">
                  <MapPinned className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle>Ruta de hoy</CardTitle>
                  <CardDescription className="mt-1">
                    La primera ruta activa planificada para la fecha actual.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {todayRoute ? (
                  <>
                    <div className="space-y-1">
                      <p className="font-medium">{todayRoute.name}</p>
                      <p className="text-muted-foreground text-sm">
                        {getFieldStatusLabel(todayRoute.status)} · {completedStops + skippedStops}/
                        {routeStops.length || 0} paradas procesadas
                      </p>
                    </div>
                    <Button asChild className="w-full justify-between">
                      <Link href={`/field/rutas/${todayRoute.id}`}>
                        Abrir ruta
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </>
                ) : (
                  <EmptyState
                    icon={<Clock3 className="text-primary h-10 w-10" />}
                    title="Sin ruta hoy"
                    description="Cuando tengas una ruta programada para hoy aparecerá aquí."
                    className="bg-muted/20 min-h-[180px] border"
                  />
                )}
              </CardContent>
            </Card>

            <Card className="border-border/70 shadow-sm">
              <CardHeader className="space-y-3">
                <div className="bg-primary/10 text-primary flex h-12 w-12 items-center justify-center rounded-2xl">
                  <PackageOpen className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle>Pedidos operativos</CardTitle>
                  <CardDescription className="mt-1">
                    Conteo rápido de pedidos pendientes y ya cerrados.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-muted/20 rounded-xl border p-4">
                    <p className="text-muted-foreground text-xs tracking-[0.14em] uppercase">
                      Pendientes
                    </p>
                    <p className="mt-2 text-2xl font-semibold">{pendingOrders}</p>
                  </div>
                  <div className="bg-muted/20 rounded-xl border p-4">
                    <p className="text-muted-foreground text-xs tracking-[0.14em] uppercase">
                      Finalizados
                    </p>
                    <p className="mt-2 text-2xl font-semibold">{finishedOrders}</p>
                  </div>
                </div>
                <Button asChild variant="outline" className="w-full justify-between">
                  <Link href="/field/pedidos">
                    Ver pedidos
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="border-border/70 shadow-sm">
              <CardHeader className="space-y-3">
                <div className="bg-primary/10 text-primary flex h-12 w-12 items-center justify-center rounded-2xl">
                  <Activity className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle>Actividad reciente</CardTitle>
                  <CardDescription className="mt-1">
                    Resumen operativo rápido para la jornada actual.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="bg-muted/20 rounded-xl border p-4 text-sm">
                  <p className="font-medium">Paradas completadas</p>
                  <p className="text-muted-foreground mt-1">
                    {completedStops} completadas · {skippedStops} omitidas
                  </p>
                </div>
                <div className="bg-muted/20 rounded-xl border p-4 text-sm">
                  <p className="font-medium">Acción rápida</p>
                  <p className="text-muted-foreground mt-1">
                    Crea una autoventa rápida si surge una oportunidad en ruta.
                  </p>
                </div>
                <Button asChild variant="outline" className="w-full justify-between">
                  <Link href="/field/autoventa">
                    Nueva autoventa
                    <ShoppingCart className="h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
