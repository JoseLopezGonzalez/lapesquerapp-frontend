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
import { Package, Truck } from 'lucide-react';
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

function formatWeight(value: number | undefined | null): string {
  return (
    new Intl.NumberFormat('es-ES', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value ?? 0) + ' kg'
  );
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

    receptions.forEach((r) => {
      getOrCreate(r.date.slice(0, 10)).receptions.push(r);
    });
    dispatches.forEach((d) => {
      getOrCreate(d.date.slice(0, 10)).dispatches.push(d);
    });

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

  let lastRenderedMonth = -1;

  return (
    <div className="space-y-3 p-6 pt-2">
      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-2">
        {WEEKDAYS.map((day, i) => {
          const isWeekend = i === 5 || i === 6;
          return (
            <div
              key={i}
              className={cn(
                'rounded-md px-1 py-2 text-center text-sm font-semibold',
                isWeekend ? 'text-muted-foreground/60' : 'text-muted-foreground'
              )}
            >
              {day}
            </div>
          );
        })}
      </div>

      {/* Calendar weeks */}
      <div className="space-y-2">
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
                <p className="mb-1 px-1 text-sm font-semibold capitalize text-muted-foreground">
                  {format(firstInRange!, 'MMMM yyyy', { locale: es })}
                </p>
              )}
              <div className="grid grid-cols-7 gap-2">
                {week.map((day, dayIdx) => {
                  const dateKey = format(day, 'yyyy-MM-dd');
                  const inRange = isWithinInterval(day, { start: rangeStart, end: rangeEnd });
                  const dayData = inRange
                    ? (dayMap.get(dateKey) ?? { receptions: [], dispatches: [] })
                    : { receptions: [], dispatches: [] };

                  const hasReceptions = dayData.receptions.length > 0;
                  const hasDispatches = dayData.dispatches.length > 0;
                  const hasActivity = hasReceptions || hasDispatches;
                  const isCurrentDay = isToday(day);
                  const isWeekend = dayIdx === 5 || dayIdx === 6;

                  const totalRecWeight = dayData.receptions.reduce(
                    (s, r) => s + (r.calculated_total_net_weight ?? 0),
                    0
                  );
                  const totalDispWeight = dayData.dispatches.reduce(
                    (s, d) => s + (d.total_net_weight ?? 0),
                    0
                  );

                  return (
                    <button
                      key={dayIdx}
                      onClick={() => inRange && hasActivity && handleDayClick(day, dayData)}
                      disabled={!hasActivity || !inRange}
                      className={cn(
                        'relative min-h-[110px] rounded-lg border p-2.5 text-left shadow-sm transition-all duration-200',
                        'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                        // Out of range
                        !inRange && 'cursor-default bg-muted/20 opacity-30',
                        // In range, no activity
                        inRange && !hasActivity && !isWeekend && 'bg-background',
                        inRange && !hasActivity && isWeekend && 'bg-muted/30',
                        // In range, with activity — color by type
                        inRange &&
                          hasReceptions &&
                          !hasDispatches &&
                          'border-blue-300 bg-blue-50/60 dark:border-blue-700 dark:bg-blue-950/20',
                        inRange &&
                          hasDispatches &&
                          !hasReceptions &&
                          'border-orange-300 bg-orange-50/60 dark:border-orange-700 dark:bg-orange-950/20',
                        inRange &&
                          hasReceptions &&
                          hasDispatches &&
                          'border-green-300 bg-green-50/60 dark:border-green-700 dark:bg-green-950/20',
                        // Hover + pointer
                        inRange &&
                          hasActivity &&
                          'cursor-pointer hover:scale-[1.02] hover:shadow-md',
                        // Today
                        isCurrentDay &&
                          inRange &&
                          'border-2 border-primary ring-2 ring-primary/20'
                      )}
                    >
                      <div className="flex h-full flex-col">
                        {/* Day number */}
                        <span
                          className={cn(
                            'absolute right-2.5 top-2 text-sm',
                            isCurrentDay && inRange
                              ? 'font-semibold text-primary'
                              : 'font-normal text-foreground',
                            !inRange && 'text-muted-foreground'
                          )}
                        >
                          {day.getDate()}
                        </span>

                        {/* Activity content */}
                        {hasActivity && inRange && (
                          <div className="mt-5 flex-1 space-y-1.5">
                            {hasReceptions && (
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-1 text-xs">
                                  <Package className="h-3 w-3 shrink-0 text-blue-600 dark:text-blue-400" />
                                  <span className="font-semibold leading-tight text-blue-700 dark:text-blue-400">
                                    {dayData.receptions.length}{' '}
                                    {dayData.receptions.length === 1 ? 'recepción' : 'recepciones'}
                                  </span>
                                </div>
                                <p className="pl-4 text-[10px] leading-tight text-blue-600/80 dark:text-blue-400/80">
                                  {formatWeight(totalRecWeight)}
                                </p>
                              </div>
                            )}

                            {hasDispatches && (
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-1 text-xs">
                                  <Truck className="h-3 w-3 shrink-0 text-orange-600 dark:text-orange-400" />
                                  <span className="font-semibold leading-tight text-orange-700 dark:text-orange-400">
                                    {dayData.dispatches.length}{' '}
                                    {dayData.dispatches.length === 1 ? 'salida' : 'salidas'}
                                  </span>
                                </div>
                                <p className="pl-4 text-[10px] leading-tight text-orange-600/80 dark:text-orange-400/80">
                                  {formatWeight(totalDispWeight)}
                                </p>
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
      <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-border/50 pt-4">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded-md border-2 border-primary shadow-sm" />
          <span className="text-sm font-medium text-muted-foreground">Hoy</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded-md border border-blue-300 bg-blue-50 shadow-sm dark:border-blue-700 dark:bg-blue-950/20" />
          <span className="text-sm font-medium text-muted-foreground">Solo recepciones</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded-md border border-orange-300 bg-orange-50 shadow-sm dark:border-orange-700 dark:bg-orange-950/20" />
          <span className="text-sm font-medium text-muted-foreground">Solo salidas</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded-md border border-green-300 bg-green-50 shadow-sm dark:border-green-700 dark:bg-green-950/20" />
          <span className="text-sm font-medium text-muted-foreground">Mixto</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded-md border bg-muted/20 opacity-50 shadow-sm" />
          <span className="text-sm font-medium text-muted-foreground">Fuera del período</span>
        </div>
      </div>

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
