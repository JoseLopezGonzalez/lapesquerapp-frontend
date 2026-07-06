'use client';

import { type ChangeEvent } from 'react';
import { Link2Off } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { PalletState } from '@/hooks/pallets/palletHelpers';
import { normalizeOrderOptions, type RawOrderOption } from '../utils/orderOptions';

interface InfoTabProps {
  temporalPallet: PalletState;
  onEditObservations: (obs: string) => void;
  onEditPalletTareWeightKg: (value: string) => void;
  onEditOrderId: (id: number | string | null) => void;
  activeOrdersOptions: RawOrderOption[];
  activeOrdersLoading: boolean;
  orderIdBlocked: boolean;
  isReadOnly: boolean;
  externalActor: boolean;
}

export default function InfoTab({
  temporalPallet,
  onEditObservations,
  onEditPalletTareWeightKg,
  onEditOrderId,
  activeOrdersOptions,
  activeOrdersLoading,
  orderIdBlocked,
  isReadOnly,
  externalActor,
}: InfoTabProps) {
  const normalizedActiveOrdersOptions = normalizeOrderOptions(activeOrdersOptions);

  return (
    <div className="flex flex-col gap-5 pb-4">
      <div className="flex flex-col gap-2">
        <Label className="text-sm font-medium">Tara del palet vacío (kg)</Label>
        <Input
          type="number"
          min="0"
          step="0.01"
          inputMode="decimal"
          defaultValue={temporalPallet.palletTareWeightKg ?? ''}
          onChange={(e: ChangeEvent<HTMLInputElement>) => onEditPalletTareWeightKg(e.target.value)}
          className="text-right"
          placeholder="0.00"
          disabled={isReadOnly}
        />
        <p className="text-xs text-muted-foreground">
          Peso físico del palet vacío. No modifica el peso neto.
        </p>
      </div>

      {/* Observations */}
      <div className="flex flex-col gap-2">
        <Label className="text-sm font-medium">Observaciones</Label>
        <Textarea
          defaultValue={temporalPallet.observations ?? ''}
          onChange={(e: ChangeEvent<HTMLTextAreaElement>) => onEditObservations(e.target.value)}
          className="min-h-[120px] resize-none"
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
            onValueChange={(value: string) => onEditOrderId(value || null)}
          >
            <SelectTrigger className="w-full" loading={activeOrdersLoading}>
              <SelectValue placeholder="Sin pedido asignado" loading={activeOrdersLoading} />
            </SelectTrigger>
            <SelectContent loading={activeOrdersLoading}>
              {normalizedActiveOrdersOptions.map((order) => (
                <SelectItem key={order.value} value={order.value}>
                  {order.label}
                </SelectItem>
              ))}
              {temporalPallet.orderId &&
                !normalizedActiveOrdersOptions.some(
                  (order) => order.value === String(temporalPallet.orderId)
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
    </div>
  );
}
