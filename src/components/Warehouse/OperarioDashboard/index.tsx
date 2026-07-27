'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, Calendar, Calculator, RotateCw } from 'lucide-react';
import { formatDate } from '@/helpers/formats/dates/formatDates';
import { cn } from '@/lib/utils';
import ReceptionsListCard from '../ReceptionsListCard';
import DispatchesListCard from '../DispatchesListCard';
import NetWeightCalculatorDialog from '../NetWeightCalculatorDialog';

const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

// Same gradient as admin dashboard KPI cards
const CARD_CLASS =
  'rounded-2xl shadow-sm border bg-gradient-to-t from-neutral-100 to-white dark:from-neutral-800 dark:to-neutral-900';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 12) return 'Buenos días,';
  if (hour >= 12 && hour < 20) return 'Buenas tardes,';
  return 'Buenas noches,';
}

function useCurrentDateTime() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}

interface OperarioDashboardProps {
  storeId?: string | number | null;
}

export default function OperarioDashboard({ storeId = null }: OperarioDashboardProps) {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [greeting] = useState<string>(() => getGreeting());
  const [calculatorOpen, setCalculatorOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const userName = (session?.user as { name?: string } | undefined)?.name ?? 'Usuario';
  const now = useCurrentDateTime();
  const timeStr = now.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  const dateStr = formatDate(now);
  const dayStr = DAY_NAMES[now.getDay()];

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['receptions', 'list'] }),
        queryClient.invalidateQueries({ queryKey: ['dispatches', 'list'] }),
      ]);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="flex h-full min-h-0 w-full max-w-full flex-col gap-4 px-4 py-3 md:px-6">
      {/* Header — same style as admin dashboard */}
      <div className="flex shrink-0 items-center justify-between gap-2">
        <div>
          <p className="text-lg text-neutral-500 dark:text-neutral-400">{greeting}</p>
          <h1 className="text-3xl font-light md:text-4xl">{userName}</h1>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="shrink-0"
          aria-label={
            isRefreshing
              ? 'Recargando recepciones y salidas de cebo'
              : 'Actualizar recepciones y salidas de cebo'
          }
          title="Actualizar recepciones y salidas de cebo"
        >
          <RotateCw className={cn('h-4 w-4', isRefreshing && 'animate-spin', 'sm:mr-2')} />
          <span className="hidden sm:inline">{isRefreshing ? 'Recargando…' : 'Recargar'}</span>
        </Button>
      </div>

      {/* Info cards — 2×2 on mobile, 4-column on large screens.
          Uses p-3 directly on Card (avoids CardContent double-padding issue). */}
      <div className="grid shrink-0 grid-cols-2 gap-3 lg:grid-cols-4">
        <Card className={cn(CARD_CLASS, 'p-3')}>
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
              <Clock className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-muted-foreground">Hora</p>
              <p className="text-base font-semibold tracking-tight tabular-nums">{timeStr}</p>
            </div>
          </div>
        </Card>

        <Card className={cn(CARD_CLASS, 'p-3')}>
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-muted-foreground">Fecha</p>
              <p className="truncate text-base font-semibold tracking-tight">{dateStr}</p>
            </div>
          </div>
        </Card>

        <Card className={cn(CARD_CLASS, 'p-3')}>
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-muted-foreground">Día</p>
              <p className="truncate text-base font-semibold tracking-tight">{dayStr}</p>
            </div>
          </div>
        </Card>

        <Card
          className={cn(
            CARD_CLASS,
            'cursor-pointer p-3 transition-colors hover:border-primary/30 hover:bg-muted/30'
          )}
          onClick={() => setCalculatorOpen(true)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setCalculatorOpen(true);
            }
          }}
          aria-label="Abrir calculadora de peso neto"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
              <Calculator className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-muted-foreground">Herramientas</p>
              <p className="truncate text-base font-semibold tracking-tight">Calculadora</p>
            </div>
          </div>
        </Card>
      </div>

      {/* List cards: stacked on mobile, side by side on desktop.
          Each wrapped in flex-1 min-h-0 so they split the remaining height equally. */}
      <div className="flex min-h-0 flex-1 flex-col gap-4 md:grid md:grid-cols-2 md:gap-6">
        <div className="flex min-h-0 flex-1 flex-col">
          <ReceptionsListCard storeId={storeId} />
        </div>
        <div className="flex min-h-0 flex-1 flex-col">
          <DispatchesListCard storeId={storeId} />
        </div>
      </div>

      <NetWeightCalculatorDialog open={calculatorOpen} onOpenChange={setCalculatorOpen} />
    </div>
  );
}
