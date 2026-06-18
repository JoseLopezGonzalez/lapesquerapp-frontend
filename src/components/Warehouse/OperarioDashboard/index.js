'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, Calendar, Calculator, RotateCw } from 'lucide-react';
import { formatDate } from '@/helpers/formats/dates/formatDates';
import ReceptionsListCard from '../ReceptionsListCard';
import DispatchesListCard from '../DispatchesListCard';
import NetWeightCalculatorDialog from '../NetWeightCalculatorDialog';

const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

const DASHBOARD_CARD_CLASS =
  'rounded-2xl shadow-sm border bg-gradient-to-t from-neutral-100 to-white dark:from-neutral-800 dark:to-neutral-900';

function getGreeting() {
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

export default function OperarioDashboard({ storeId = null }) {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [greeting] = useState(() => getGreeting());
  const [calculatorOpen, setCalculatorOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const userName = session?.user?.name || 'Usuario';
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
    <div className="flex h-full min-h-0 w-full max-w-full flex-col gap-4">
      <div className="mb-2 flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between md:mb-4">
        <div>
          <p className="md:text-md text-lg text-neutral-500 dark:text-neutral-400">{greeting}</p>
          <h1 className="text-3xl font-light md:text-4xl">{userName}</h1>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="shrink-0 self-start sm:self-center"
          title="Actualizar recepciones y salidas de cebo"
        >
          <RotateCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Recargando…' : 'Recargar'}
        </Button>
      </div>

      {/* Grid de 4 cards: Hora, Fecha, Día, Acciones — mismo estilo que dashboard normal */}
      <div className="grid shrink-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className={DASHBOARD_CARD_CLASS + ' flex flex-col justify-center'}>
          <CardContent className="flex items-center gap-3 p-6">
            <div className="bg-muted flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
              <Clock className="text-muted-foreground h-5 w-5" />
            </div>
            <div>
              <p className="text-muted-foreground text-sm font-medium">Hora</p>
              <p className="text-3xl font-medium tracking-tight tabular-nums">{timeStr}</p>
            </div>
          </CardContent>
        </Card>
        <Card className={DASHBOARD_CARD_CLASS + ' flex flex-col justify-center'}>
          <CardContent className="flex items-center gap-3 p-6">
            <div className="bg-muted flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
              <Calendar className="text-muted-foreground h-5 w-5" />
            </div>
            <div>
              <p className="text-muted-foreground text-sm font-medium">Fecha</p>
              <p className="text-3xl font-medium tracking-tight">{dateStr}</p>
            </div>
          </CardContent>
        </Card>
        <Card className={DASHBOARD_CARD_CLASS + ' flex flex-col justify-center'}>
          <CardContent className="flex items-center gap-3 p-6">
            <div className="bg-muted flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
              <Calendar className="text-muted-foreground h-5 w-5" />
            </div>
            <div>
              <p className="text-muted-foreground text-sm font-medium">Día</p>
              <p className="text-3xl font-medium tracking-tight">{dayStr}</p>
            </div>
          </CardContent>
        </Card>
        <Card
          className={
            DASHBOARD_CARD_CLASS +
            ' flex flex-col justify-center hover:border-primary/30 hover:bg-muted/30 cursor-pointer transition-colors'
          }
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
          <CardContent className="flex items-center gap-3 p-6">
            <div className="bg-muted flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
              <Calculator className="text-muted-foreground h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-muted-foreground text-sm font-medium">Herramientas</p>
              <p className="truncate text-3xl font-medium tracking-tight">Calculadora</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dos columnas: Recepciones | Salidas — ocupan el resto del alto con scroll en tablas */}
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-6 lg:grid-cols-2">
        <ReceptionsListCard storeId={storeId} />
        <DispatchesListCard storeId={storeId} />
      </div>

      <NetWeightCalculatorDialog open={calculatorOpen} onOpenChange={setCalculatorOpen} />
    </div>
  );
}
