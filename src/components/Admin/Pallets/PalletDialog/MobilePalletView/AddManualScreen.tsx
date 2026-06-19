'use client';

import { type ChangeEvent, useState } from 'react';
import { Check, Plus, RotateCcw } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MobileCombobox } from '@/components/Shadcn/MobileCombobox';
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
  totalBoxCount?: number;
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
  totalBoxCount = 0,
}: AddManualScreenProps) {
  const [productError, setProductError] = useState<string | null>(null);
  const [justAdded, setJustAdded] = useState(false);
  const [quantity, setQuantity] = useState('1');
  const [resetDialogOpen, setResetDialogOpen] = useState(false);

  const parsedQuantity = Math.max(1, parseInt(quantity) || 1);

  const handleAdd = () => {
    if (!boxCreationData.productId) {
      setProductError('Selecciona un artículo antes de añadir');
      return;
    }
    setProductError(null);
    for (let i = 0; i < parsedQuantity; i++) {
      onAddNewBox({ method: 'manual' });
    }
    boxCreationDataChange('lot', '');
    boxCreationDataChange('netWeight', '');
    setQuantity('1');
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 600);
  };

  const handleConfirmReset = () => {
    onResetBoxCreationData();
    setQuantity('1');
    setResetDialogOpen(false);
  };

  return (
    <div className="flex h-full flex-col">
      <MobilePalletScreenHeader title="Añadir caja manualmente" onBack={onBack} />

      {/* Form */}
      <div className="flex flex-1 flex-col gap-5 overflow-auto px-4 py-5">
        <div className="space-y-1.5">
          <Label className="text-sm">Artículo</Label>
          <MobileCombobox
            options={productsOptions}
            placeholder="Seleccionar artículo"
            searchPlaceholder="Buscar artículo..."
            notFoundMessage="No se encontraron artículos"
            title="Seleccionar artículo"
            value={boxCreationData.productId}
            onChange={(value) => {
              boxCreationDataChange('productId', value);
              if (value) setProductError(null);
            }}
            disabled={isReadOnly}
            loading={productsLoading}
          />
          {productError && <p className="text-xs text-destructive">{productError}</p>}
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
              type="text"
              inputMode="decimal"
              placeholder="0.00"
              value={boxCreationData.netWeight}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                boxCreationDataChange('netWeight', e.target.value)
              }
              disabled={isReadOnly}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm">Número de cajas</Label>
          <Input
            type="text"
            inputMode="numeric"
            placeholder="1"
            value={quantity}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setQuantity(e.target.value.replace(/\D/g, ''))
            }
            disabled={isReadOnly}
            className="w-28"
          />
        </div>

        {canEditCost && (
          <div className="space-y-1.5">
            <Label className="text-sm">Coste manual (€/kg)</Label>
            <Input
              type="text"
              inputMode="decimal"
              placeholder="Opcional"
              value={boxCreationData.manualCostPerKg}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                boxCreationDataChange('manualCostPerKg', e.target.value)
              }
              disabled={isReadOnly}
            />
          </div>
        )}
      </div>

      {/* CTAs sticky at bottom */}
      <div
        className="shrink-0 border-t bg-background px-4 pb-4 pt-3"
        style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
      >
        <p className="mb-2.5 text-center text-xs text-muted-foreground">
          Cajas en el palet:{' '}
          <span className="font-semibold text-foreground">{totalBoxCount}</span>
        </p>
        <div className="flex gap-3">
          <Button
            size="lg"
            className="flex-1 gap-2"
            onClick={handleAdd}
            disabled={productsLoading || isReadOnly || justAdded}
          >
            {justAdded ? (
              <>
                <Check className="h-5 w-5" />
                {parsedQuantity > 1 ? `${parsedQuantity} añadidas` : 'Añadida'}
              </>
            ) : (
              <>
                <Plus className="h-5 w-5" />
                {parsedQuantity > 1 ? `Añadir ${parsedQuantity} al palet` : 'Añadir al palet'}
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="min-w-[88px] gap-2"
            onClick={() => setResetDialogOpen(true)}
            disabled={isReadOnly}
          >
            <RotateCcw className="h-4 w-4" />
            Limpiar
          </Button>
        </div>
      </div>

      <AlertDialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Limpiar el formulario?</AlertDialogTitle>
            <AlertDialogDescription>
              Se borrarán el artículo, lote, peso y cantidad seleccionados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmReset}>Limpiar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
