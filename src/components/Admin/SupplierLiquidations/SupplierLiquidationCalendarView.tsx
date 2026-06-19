'use client';

import { useMemo, useState } from 'react';
import {
  eachDayOfInterval,
  endOfWeek,
  format,
  isToday,
  isWithinInterval,
  parseISO,
  startOfWeek,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { Lock, Package, Truck } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { LiquidationDispatch, LiquidationReception } from '@/types/supplierLiquidation';
import { LiquidationDayDialog, type LiquidationDayData } from './LiquidationDayDialog';

const WEEKDAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

interface SupplierLiquidationCalendarViewProps {
  receptions: LiquidationReception[];
  dispatches: LiquidationDispatch[];
  startDate: string;
  endDate: string;
}

export function SupplierLiquidationCalendarView({
  receptions,
  dispatches,
  startDate,
  endDate,
}: SupplierLiquidationCalendarViewProps) {
  const [selectedDay, setSelectedDay] = useState<{
    date: string;
    data: LiquidationDayData;
  } | null>(null);

  const rangeStart = parseISO(startDate);
  const rangeEnd = parseISO(endDate);

  const dayMap = useMemo(() => {
    const map = new Map<string, LiquidationDayData>();

    const getOrCreate = (key: string): LiquidationDayData => {
      if (!map.has(key)) map.set(key, { receptions: [], dispatches: [] });
      return map.get(key)!;
    };

    receptions.forEach((r) => getOrCreate(r.date.slice(0, 10)).receptions.push(r));
    dispatches.forEach((d) => getOrCreate(d.date.slice(0, 10)).dispatches.push(d));

    return map;
  }, [receptions, dispatches]);

  const calStart = startOfWeek(rangeStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(rangeEnd, { weekStartsOn: 1 });
  const allDays = eachDayOfInterval({ start: calStart, end: calEnd });

  const weeks: Date[][] = [];
  for (let i = 0; i < allDays.length; i += 7) {
    weeks.push(allDays.slice(i, i + 7));
  }

  const handleDayClick = (day: Date, data: LiquidationDayData) => {
    if (data.receptions.length === 0 && data.dispatches.length === 0) return;
    setSelectedDay({ date: format(day, 'yyyy-MM-dd'), data });
  };

  const totalItems = receptions.length + dispatches.length;
  const liquidatedCount =
    receptions.filter((r) => !!r.supplier_liquidation_id).length +
    dispatches.filter((d) => !!d.supplier_liquidation_id).length;

  let lastRenderedMonth = -1;

  return (
    <div className="p-6 pt-2">
      <Card className="mb-6 shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle>Calendario de actividad</CardTitle>
          <CardDescription>
            {receptions.length} {receptions.length === 1 ? 'recepción' : 'recepciones'} ·{' '}
            {dispatches.length} {dispatches.length === 1 ? 'salida de cebo' : 'salidas de cebo'}
            {liquidatedCount > 0 && (
              <>
                {' '}·{' '}
                <span className="text-amber-600 dark:text-amber-400">
                  {liquidatedCount} {liquidatedCount === 1 ? 'ya liquidado' : 'ya liquidados'}
                </span>
              </>
            )}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="space-y-3">
            {/* Weekday headers */}
            <div className="mb-2 grid grid-cols-7 gap-2.5">
              {WEEKDAYS.map((day, index) => {
                const isWeekend = index === 5 || index === 6;
                return (
                  <div
                    key={index}
                    className={cn(
                      'rounded-md px-1 py-2.5 text-center text-sm font-semibold',
                      isWeekend
                        ? 'bg-muted/50 text-muted-foreground'
                        : 'text-muted-foreground'
                    )}
                  >
                    {day}
                  </div>
                );
              })}
            </div>

            {/* Calendar weeks */}
            <div className="space-y-2.5">
              {weeks.map((week, weekIdx) => {
                const firstInRange = week.find((d) =>
                  isWithinInterval(d, { start: rangeStart, end: rangeEnd })
                );
                const weekMonth = firstInRange ? firstInRange.getMonth() : -1;
                const showMonthHeader = weekMonth !== -1 && weekMonth !== lastRenderedMonth;
                if (showMonthHeader) lastRenderedMonth = weekMonth;

                return (
                  <div key={weekIdx} className={cn(showMonthHeader && weekIdx > 0 && 'mt-4')}>
                    {showMonthHeader && (
                      <p className="mb-2 px-0.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground capitalize">
                        {format(firstInRange!, 'MMMM yyyy', { locale: es })}
                      </p>
                    )}

                    <div className="grid grid-cols-7 gap-2.5">
                      {week.map((day, dayIdx) => {
                        const dateKey = format(day, 'yyyy-MM-dd');
                        const inRange = isWithinInterval(day, {
                          start: rangeStart,
                          end: rangeEnd,
                        });
                        const dayData = inRange
                          ? (dayMap.get(dateKey) ?? { receptions: [], dispatches: [] })
                          : { receptions: [], dispatches: [] };

                        const hasReceptions = dayData.receptions.length > 0;
                        const hasDispatches = dayData.dispatches.length > 0;
                        const hasActivity = hasReceptions || hasDispatches;
                        const isCurrentDay = isToday(day);
                        const dayOfWeek = day.getDay();
                        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

                        // Per-type free/locked counts
                        const freeRec = dayData.receptions.filter(
                          (r) => !r.supplier_liquidation_id
                        ).length;
                        const lockedRec = dayData.receptions.length - freeRec;
                        const freeDisp = dayData.dispatches.filter(
                          (d) => !d.supplier_liquidation_id
                        ).length;
                        const lockedDisp = dayData.dispatches.length - freeDisp;

                        const hasFreeRec = freeRec > 0;
                        const hasFreeDisp = freeDisp > 0;
                        const hasLockedRec = lockedRec > 0;
                        const hasLockedDisp = lockedDisp > 0;
                        const totalLiq = lockedRec + lockedDisp;
                        const allLiquidated =
                          hasActivity && totalLiq === dayData.receptions.length + dayData.dispatches.length;

                        // Visual bars: free (blue/orange) + locked (amber), up to 2 each
                        const freeRecBars = Math.min(freeRec, 2);
                        const freeDispBars = Math.min(freeDisp, 2);
                        const lockedBars = Math.min(totalLiq, 2);
                        const totalBars = freeRecBars + freeDispBars + lockedBars;
                        const overflowCount =
                          Math.max(0, freeRec - freeRecBars) +
                          Math.max(0, freeDisp - freeDispBars) +
                          Math.max(0, totalLiq - lockedBars);

                        return (
                          <button
                            key={dayIdx}
                            onClick={() =>
                              hasActivity && inRange && handleDayClick(day, dayData)
                            }
                            disabled={!hasActivity || !inRange}
                            className={cn(
                              'relative min-h-[110px] rounded-lg border p-2.5 transition-all duration-200',
                              'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                              'shadow-sm hover:shadow-md',
                              // Out of range
                              !inRange && 'opacity-30',
                              // In range, no activity (weekends)
                              inRange &&
                                !hasActivity &&
                                isWeekend &&
                                'bg-gray-200 dark:bg-gray-800/70',
                              // In range, no activity (weekdays)
                              inRange &&
                                !hasActivity &&
                                !isWeekend &&
                                'bg-background hover:bg-muted/50',
                              // All already liquidated → amber
                              inRange &&
                                allLiquidated &&
                                'border-amber-400 bg-amber-50 shadow-amber-100 dark:border-amber-600 dark:bg-amber-950/20 dark:shadow-amber-950',
                              // Color based on FREE items (shows what is still available)
                              inRange &&
                                !allLiquidated &&
                                hasFreeRec &&
                                !hasFreeDisp &&
                                'border-blue-300 bg-blue-50 dark:border-blue-700 dark:bg-blue-950/20',
                              inRange &&
                                !allLiquidated &&
                                hasFreeDisp &&
                                !hasFreeRec &&
                                'border-orange-300 bg-orange-50 dark:border-orange-700 dark:bg-orange-950/20',
                              inRange &&
                                !allLiquidated &&
                                hasFreeRec &&
                                hasFreeDisp &&
                                'border-green-300 bg-green-50 dark:border-green-700 dark:bg-green-950/20',
                              // Hover
                              hasActivity &&
                                inRange &&
                                'cursor-pointer hover:scale-[1.02] hover:shadow-lg',
                              !hasActivity && 'cursor-default',
                              // Today
                              isCurrentDay &&
                                inRange &&
                                'border-2 border-primary shadow-md ring-2 ring-primary/20',
                            )}
                          >
                            <div className="relative flex h-full flex-col">
                              {/* Day number */}
                              <div
                                className={cn(
                                  'absolute right-2 top-1.5 text-lg font-normal',
                                  isCurrentDay && inRange && 'text-primary',
                                  !inRange && 'text-muted-foreground opacity-50',
                                  inRange && !isCurrentDay && 'text-foreground'
                                )}
                              >
                                {day.getDate()}
                              </div>

                              {/* Activity */}
                              {hasActivity && inRange && (
                                <div className="mt-6 flex-1 space-y-1.5">
                                  {/* Free receptions */}
                                  {hasFreeRec && (
                                    <div className="flex items-center gap-1.5 text-xs">
                                      <Package className="h-3.5 w-3.5 shrink-0 text-blue-600 dark:text-blue-500" />
                                      <span className="font-semibold leading-tight text-blue-700 dark:text-blue-400">
                                        {freeRec}{' '}
                                        {freeRec === 1 ? 'recepción' : 'recepciones'}
                                      </span>
                                    </div>
                                  )}

                                  {/* Locked receptions */}
                                  {hasLockedRec && (
                                    <div className="flex items-center gap-1.5 text-xs">
                                      <Lock className="h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
                                      <span className="font-semibold leading-tight text-amber-700 dark:text-amber-400">
                                        {lockedRec}{' '}
                                        {lockedRec === 1 ? 'recepción liq.' : 'recepciones liq.'}
                                      </span>
                                    </div>
                                  )}

                                  {/* Free dispatches */}
                                  {hasFreeDisp && (
                                    <div className="flex items-center gap-1.5 text-xs">
                                      <Truck className="h-3.5 w-3.5 shrink-0 text-orange-600 dark:text-orange-500" />
                                      <span className="font-semibold leading-tight text-orange-700 dark:text-orange-400">
                                        {freeDisp}{' '}
                                        {freeDisp === 1 ? 'salida' : 'salidas'}
                                      </span>
                                    </div>
                                  )}

                                  {/* Locked dispatches */}
                                  {hasLockedDisp && (
                                    <div className="flex items-center gap-1.5 text-xs">
                                      <Lock className="h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
                                      <span className="font-semibold leading-tight text-amber-700 dark:text-amber-400">
                                        {lockedDisp}{' '}
                                        {lockedDisp === 1 ? 'salida liq.' : 'salidas liq.'}
                                      </span>
                                    </div>
                                  )}

                                  {/* Visual bars: blue=free rec · orange=free disp · amber=locked */}
                                  {totalBars > 0 && (
                                    <div className="mt-2 flex gap-1 border-t border-border/50 pt-1.5">
                                      {Array.from({ length: freeRecBars }).map((_, i) => (
                                        <div
                                          key={`fr${i}`}
                                          className="h-2 w-full rounded-full bg-gradient-to-r from-blue-400 to-blue-600 shadow-sm"
                                        />
                                      ))}
                                      {Array.from({ length: freeDispBars }).map((_, i) => (
                                        <div
                                          key={`fd${i}`}
                                          className="h-2 w-full rounded-full bg-gradient-to-r from-orange-400 to-orange-600 shadow-sm"
                                        />
                                      ))}
                                      {Array.from({ length: lockedBars }).map((_, i) => (
                                        <div
                                          key={`lk${i}`}
                                          className="h-2 w-full rounded-full bg-gradient-to-r from-amber-300 to-amber-500 shadow-sm"
                                        />
                                      ))}
                                    </div>
                                  )}
                                  {overflowCount > 0 && (
                                    <div className="text-[10px] font-medium text-muted-foreground">
                                      +{overflowCount} más
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="mt-5 flex flex-wrap items-center gap-4 border-t border-border/50 pt-5">
              <div className="flex items-center gap-2.5">
                <div className="h-4 w-4 rounded-md border-2 border-primary shadow-sm" />
                <span className="text-sm font-medium text-muted-foreground">Hoy</span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="h-4 w-4 rounded-md border border-blue-300 bg-blue-50 shadow-sm dark:border-blue-700 dark:bg-blue-950/20" />
                <span className="text-sm font-medium text-muted-foreground">Recepciones</span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="h-4 w-4 rounded-md border border-orange-300 bg-orange-50 shadow-sm dark:border-orange-700 dark:bg-orange-950/20" />
                <span className="text-sm font-medium text-muted-foreground">Salidas de cebo</span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="h-4 w-4 rounded-md border border-green-300 bg-green-50 shadow-sm dark:border-green-700 dark:bg-green-950/20" />
                <span className="text-sm font-medium text-muted-foreground">Mixto</span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="h-4 w-4 rounded-md border border-amber-400 bg-amber-50 shadow-sm dark:border-amber-600 dark:bg-amber-950/20" />
                <span className="text-sm font-medium text-muted-foreground">Ya liquidado</span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="h-2 w-6 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 shadow-sm" />
                <span className="text-sm font-medium text-muted-foreground">Recep. libre</span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="h-2 w-6 rounded-full bg-gradient-to-r from-orange-400 to-orange-600 shadow-sm" />
                <span className="text-sm font-medium text-muted-foreground">Salida libre</span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="h-2 w-6 rounded-full bg-gradient-to-r from-amber-300 to-amber-500 shadow-sm" />
                <span className="text-sm font-medium text-muted-foreground">Liq.</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Day detail dialog */}
      {selectedDay && (
        <LiquidationDayDialog
          dateStr={selectedDay.date}
          data={selectedDay.data}
          open={!!selectedDay}
          onOpenChange={(open) => {
            if (!open) setSelectedDay(null);
          }}
        />
      )}
    </div>
  );
}
