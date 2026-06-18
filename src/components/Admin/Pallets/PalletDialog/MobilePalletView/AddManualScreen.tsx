'use client';

import { type ChangeEvent } from 'react';
import { ArrowLeft, Plus, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Combobox } from '@/components/Shadcn/Combobox';
import type { BoxCreationData, ProductOption } from '@/hooks/pallets/palletHelpers';

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
      {/* Header */}
      <div className="flex shrink-0 items-center gap-2 border-b px-3 py-3">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-base font-semibold">Añadir caja manualmente</h2>
      </div>

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
      <div className="shrink-0 border-t px-4 py-4" style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}>
        <div className="flex flex-col gap-2">
          <Button
            size="lg"
            className="w-full gap-2"
            onClick={() => onAddNewBox({ method: 'manual' })}
            disabled={productsLoading || isReadOnly}
          >
            <Plus className="h-5 w-5" />
            Añadir al palet
          </Button>
          <Button variant="outline" className="w-full gap-2" onClick={onResetBoxCreationData}>
            <RotateCcw className="h-4 w-4" />
            Limpiar campos
          </Button>
        </div>
      </div>
    </div>
  );
}
