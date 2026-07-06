'use client';

import { useMemo } from 'react';
import { Link2Off } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MobileCombobox } from '@/components/Shadcn/MobileCombobox';
import type { PalletState } from '@/hooks/pallets/palletHelpers';
import { normalizeOrderOptions, type RawOrderOption } from '../utils/orderOptions';
import { MobilePalletScreenHeader } from './MobilePalletScreenHeader';

interface PedidoScreenProps {
  temporalPallet: PalletState;
  onEditOrderId: (id: number | string | null) => void;
  activeOrdersOptions: RawOrderOption[];
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
    const opts = normalizeOrderOptions(activeOrdersOptions);

    // If current order is not in the active list, add it so it shows correctly
    const currentId = temporalPallet.orderId ? String(temporalPallet.orderId) : null;
    if (currentId && !opts.some((option) => option.value === currentId)) {
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

        <MobileCombobox
          options={comboboxOptions}
          placeholder="Sin pedido asignado"
          searchPlaceholder="Buscar por número de pedido..."
          notFoundMessage="No se encontraron pedidos"
          title="Seleccionar pedido"
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
            variant="outline"
            size="sm"
            className="w-fit gap-1.5 border-destructive/40 text-destructive hover:bg-destructive/5 hover:text-destructive"
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
