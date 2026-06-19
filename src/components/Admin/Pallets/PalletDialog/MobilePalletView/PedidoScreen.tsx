'use client';

import { Link2Off } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatDateShort } from '@/helpers/formats/dates/formatDates';
import type { PalletState } from '@/hooks/pallets/palletHelpers';
import { MobilePalletScreenHeader } from './MobilePalletScreenHeader';

interface OrderOption {
  id: string | number;
  name: string;
  load_date: string;
}

interface PedidoScreenProps {
  temporalPallet: PalletState;
  onEditOrderId: (id: number | string | null) => void;
  activeOrdersOptions: OrderOption[];
  activeOrdersLoading: boolean;
  orderIdBlocked: boolean;
  onBack: () => void;
  isReadOnly: boolean;
}

export default function PedidoScreen({
  temporalPallet,
  onEditOrderId,
  activeOrdersOptions,
  activeOrdersLoading,
  orderIdBlocked,
  onBack,
  isReadOnly,
}: PedidoScreenProps) {
  return (
    <div className="flex h-full flex-col">
      <MobilePalletScreenHeader title="Pedido vinculado" onBack={onBack} />

      {/* Content */}
      <div className="flex flex-col gap-4 px-4 py-6">
        <p className="text-sm text-muted-foreground">
          Vincula este palet a un pedido activo para trazabilidad.
        </p>

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
            className="flex items-center gap-1.5 text-sm text-destructive hover:text-red-600"
          >
            <Link2Off className="h-4 w-4" />
            Desvincular del pedido
          </button>
        )}
      </div>
    </div>
  );
}
