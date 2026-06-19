'use client';

import { type ChangeEvent } from 'react';
import { Plus, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Combobox } from '@/components/Shadcn/Combobox';
import type { BoxCreationData, ProductOption } from '@/hooks/pallets/palletHelpers';
import { MobilePalletScreenHeader } from './MobilePalletScreenHeader';

interface AddManualScreenProps {
  productsOptions: ProductOption[];
  productsLoading: boolean;
  boxCreationData: BoxCreationData;
  boxCreationDataChange: (field: string, value: unknown) => void;
  onAddNewBox: (params: { method: string }) => void;
  onResetBoxCreationData: () => void;
  onBack: () => void;
  isReadOnly: boolean;
  canEditCost: boolean;
}

export default function AddManualScreen({
  productsOptions,
  productsLoading,
  boxCreationData,
  boxCreationDataChange,
  onAddNewBox,
  onResetBoxCreationData,
  onBack,
  isReadOnly,
  canEditCost,
}: AddManualScreenProps) {
  return (
    <div className="flex h-full flex-col">
      <MobilePalletScreenHeader title="Añadir caja manualmente" onBack={onBack} />

      {/* Form */}
      <div className="flex flex-1 flex-col gap-5 overflow-auto px-4 py-5">
        <div className="space-y-1.5">
          <Label className="text-sm">Artículo</Label>
          <Combobox
            options={productsOptions}
            placeholder="Seleccionar artículo"
            searchPlaceholder="Buscar artículo..."
            notFoundMessage="No se encontraron artículos"
            value={boxCreationData.productId}
            onChange={(value) => boxCreationDataChange('productId', value)}
            disabled={isReadOnly}
            loading={productsLoading}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-sm">Lote</Label>
            <Input
              type="text"
              placeholder="Lote"
              value={boxCreationData.lot}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                boxCreationDataChange('lot', e.target.value)
              }
              disabled={isReadOnly}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm">Peso neto (kg)</Label>
            <Input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={boxCreationData.netWeight}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                boxCreationDataChange('netWeight', e.target.value)
              }
              className="text-right"
              inputMode="decimal"
              disabled={isReadOnly}
            />
          </div>
        </div>

        {canEditCost && (
          <div className="space-y-1.5">
            <Label className="text-sm">Coste manual (€/kg)</Label>
            <Input
              type="number"
              step="0.01"
              placeholder="Opcional"
              value={boxCreationData.manualCostPerKg}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                boxCreationDataChange('manualCostPerKg', e.target.value)
              }
              className="text-right"
              inputMode="decimal"
              disabled={isReadOnly}
            />
          </div>
        )}
      </div>

      {/* CTAs sticky at bottom */}
      <div className="shrink-0 px-4 py-4" style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}>
        <div className="flex gap-3">
          <Button
            size="lg"
            className="flex-1 gap-2"
            onClick={() => onAddNewBox({ method: 'manual' })}
            disabled={productsLoading || isReadOnly}
          >
            <Plus className="h-5 w-5" />
            Añadir al palet
          </Button>
          <Button variant="outline" size="lg" className="flex-1 gap-2" onClick={onResetBoxCreationData}>
            <RotateCcw className="h-4 w-4" />
            Limpiar campos
          </Button>
        </div>
      </div>
    </div>
  );
}
