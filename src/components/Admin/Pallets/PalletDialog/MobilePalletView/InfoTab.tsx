'use client';

import { type ChangeEvent } from 'react';
import { Link2Off } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatDateShort } from '@/helpers/formats/dates/formatDates';
import type { PalletState } from '@/hooks/pallets/palletHelpers';

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
}: InfoTabProps) {
  return (
    <div className="flex flex-col gap-5 pb-4">
      {/* Observations */}
      <div className="space-y-2">
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
    </div>
  );
}
