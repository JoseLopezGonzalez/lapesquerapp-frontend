'use client';

import { type ChangeEvent, useState } from 'react';
import { ChevronDown, ChevronUp, Link2Off } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatDecimalWeight } from '@/helpers/formats/numbers/formatNumbers';
import { formatDateShort } from '@/helpers/formats/dates/formatDates';
import { PalletTimeline } from '../PalletView/PalletTimeline';
import type { PalletState } from '@/hooks/pallets/palletHelpers';
import type { PalletTimelineEntry } from '@/services/palletService';

interface OrderOption {
  id: string | number;
  name: string;
  load_date: string;
}

interface InfoTabProps {
  temporalPallet: PalletState;
  onEditObservations: (obs: string) => void;
  onEditOrderId: (id: number | string | null) => void;
  activeOrdersOptions: OrderOption[];
  activeOrdersLoading: boolean;
  orderIdBlocked: boolean;
  isReadOnly: boolean;
  externalActor: boolean;
  timeline: PalletTimelineEntry[] | null | undefined;
  timelineLoading: boolean;
  showHistorial: boolean;
}

export default function InfoTab({
  temporalPallet,
  onEditObservations,
  onEditOrderId,
  activeOrdersOptions,
  activeOrdersLoading,
  orderIdBlocked,
  isReadOnly,
  externalActor,
  timeline,
  timelineLoading,
  showHistorial,
}: InfoTabProps) {
  const [historialOpen, setHistorialOpen] = useState(false);
  const [timelineOpenStates, setTimelineOpenStates] = useState<boolean[]>([]);

  const boxes = temporalPallet.boxes ?? [];
  const totalWeight = boxes.reduce((sum, box) => sum + parseFloat(String(box.netWeight ?? 0)), 0);
  const uniqueProducts = new Set(
    boxes
      .map((b) => (b.product as { name?: string } | null)?.name)
      .filter((n): n is string => Boolean(n))
  ).size;
  const uniqueLots = new Set(boxes.map((b) => b.lot).filter(Boolean)).size;

  const handleTimelineOpenChange = (index: number, open: boolean) => {
    setTimelineOpenStates((prev) => {
      const next = [...prev];
      next[index] = open;
      return next;
    });
  };

  return (
    <div className="flex flex-col gap-5 pb-4">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1 rounded-lg bg-muted/50 p-3">
          <span className="text-xs text-muted-foreground">Cajas</span>
          <span className="text-lg font-semibold">{boxes.length}</span>
        </div>
        <div className="flex flex-col gap-1 rounded-lg bg-muted/50 p-3">
          <span className="text-xs text-muted-foreground">Peso neto</span>
          <span className="text-lg font-semibold">{formatDecimalWeight(totalWeight)} kg</span>
        </div>
        <div className="flex flex-col gap-1 rounded-lg bg-muted/50 p-3">
          <span className="text-xs text-muted-foreground">Productos</span>
          <span className="text-lg font-semibold">{uniqueProducts}</span>
        </div>
        <div className="flex flex-col gap-1 rounded-lg bg-muted/50 p-3">
          <span className="text-xs text-muted-foreground">Lotes</span>
          <span className="text-lg font-semibold">{uniqueLots}</span>
        </div>
      </div>

      <Separator />

      {/* Observations */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Observaciones</Label>
        <Textarea
          defaultValue={temporalPallet.observations ?? ''}
          onChange={(e: ChangeEvent<HTMLTextAreaElement>) => onEditObservations(e.target.value)}
          className="min-h-[80px] resize-none"
          placeholder="Observaciones sobre este palet..."
          disabled={isReadOnly}
        />
      </div>

      {/* Order link */}
      {!externalActor && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Pedido vinculado</Label>
          <Select
            disabled={orderIdBlocked || isReadOnly || activeOrdersLoading}
            value={temporalPallet.orderId ? String(temporalPallet.orderId) : ''}
            onValueChange={(value) => onEditOrderId(value || null)}
          >
            <SelectTrigger loading={activeOrdersLoading}>
              <SelectValue placeholder="Sin pedido asignado" />
            </SelectTrigger>
            <SelectContent>
              {activeOrdersOptions.map((order) => (
                <SelectItem key={order.id} value={String(order.id)}>
                  #{order.name} — {formatDateShort(order.load_date)}
                </SelectItem>
              ))}
              {temporalPallet.orderId &&
                !activeOrdersOptions.some(
                  (o) => String(o.id) === String(temporalPallet.orderId)
                ) && (
                  <SelectItem value={String(temporalPallet.orderId)}>
                    #{temporalPallet.orderId} — Pedido actual
                  </SelectItem>
                )}
            </SelectContent>
          </Select>
          {temporalPallet.orderId && !orderIdBlocked && !isReadOnly && (
            <button
              type="button"
              onClick={() => onEditOrderId(null)}
              className="flex items-center gap-1 text-xs text-destructive hover:text-red-600"
            >
              <Link2Off className="h-3.5 w-3.5" />
              Desvincular del pedido
            </button>
          )}
        </div>
      )}

      {/* Timeline */}
      {showHistorial && (
        <>
          <Separator />
          <Collapsible open={historialOpen} onOpenChange={setHistorialOpen}>
            <CollapsibleTrigger asChild>
              <button
                type="button"
                className="flex w-full items-center justify-between text-sm font-medium"
              >
                Historial de cambios
                {historialOpen ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-3">
              {timelineLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : (
                <PalletTimeline
                  timeline={timeline ?? []}
                  loading={false}
                  error={null}
                  openStates={timelineOpenStates}
                  onItemOpenChange={handleTimelineOpenChange}
                />
              )}
            </CollapsibleContent>
          </Collapsible>
        </>
      )}
    </div>
  );
}
