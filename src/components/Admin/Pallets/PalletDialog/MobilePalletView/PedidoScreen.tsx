'use client';

import { useMemo } from 'react';
import { Link2Off } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Combobox } from '@/components/Shadcn/Combobox';
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
  const comboboxOptions = useMemo(() => {
    const opts = activeOrdersOptions.map((order) => ({
      value: String(order.id),
      label: `#${order.name} — ${formatDateShort(order.load_date)}`,
    }));

    // If current order is not in the active list, add it so it shows correctly
    const currentId = temporalPallet.orderId ? String(temporalPallet.orderId) : null;
    if (currentId && !activeOrdersOptions.some((o) => String(o.id) === currentId)) {
      opts.push({ value: currentId, label: `#${currentId} — Pedido actual` });
    }

    return opts;
  }, [activeOrdersOptions, temporalPallet.orderId]);

  const currentValue = temporalPallet.orderId ? String(temporalPallet.orderId) : undefined;

  return (
    <div className="flex h-full flex-col">
      <MobilePalletScreenHeader title="Pedido vinculado" onBack={onBack} />

      <div className="flex flex-col gap-4 px-4 py-6">
        <p className="text-sm text-muted-foreground">
          Vincula este palet a un pedido activo para trazabilidad.
        </p>

        <Combobox
          options={comboboxOptions}
          placeholder="Sin pedido asignado"
          searchPlaceholder="Buscar por número de pedido..."
          notFoundMessage="No se encontraron pedidos"
          value={currentValue}
          onChange={(value) => onEditOrderId(value || null)}
          disabled={orderIdBlocked || isReadOnly || activeOrdersLoading}
          loading={activeOrdersLoading}
        />

        {orderIdBlocked && (
          <p className="text-xs text-muted-foreground">
            El pedido fue asignado desde el origen y no puede cambiarse aquí.
          </p>
        )}

        {temporalPallet.orderId && !orderIdBlocked && !isReadOnly && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="w-fit gap-1.5 text-destructive hover:bg-destructive/5 hover:text-destructive"
            onClick={() => onEditOrderId(null)}
          >
            <Link2Off className="h-4 w-4" />
            Desvincular del pedido
          </Button>
        )}
      </div>
    </div>
  );
}
