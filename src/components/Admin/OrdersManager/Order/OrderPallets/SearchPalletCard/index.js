'use client';
import React from 'react';
import { Layers, Package } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { formatDecimalWeight } from '@/helpers/formats/numbers/formatNumbers';
import { getAvailableBoxesCount, getAvailableNetWeight } from '@/helpers/pallet/boxAvailability';

export default function SearchPalletCard({
  pallet,
  isSelected = false,
  isLinkedToOtherOrder = false,
  onToggleSelection,
}) {
  // Los resultados de búsqueda SÍ tienen productsSummary del backend
  const availableBoxCount = getAvailableBoxesCount(pallet);
  const availableNetWeight = getAvailableNetWeight(pallet);

  // Usar productsSummary del backend si está disponible
  let productsSummaryArray = [];
  if (
    pallet.productsSummary &&
    Array.isArray(pallet.productsSummary) &&
    pallet.productsSummary.length > 0
  ) {
    productsSummaryArray = pallet.productsSummary.map((item) => ({
      name: item.product?.name || '',
      netWeight: parseFloat(item.availableNetWeight || 0),
      boxCount: parseInt(item.availableBoxCount || 0),
    }));
  } else if (pallet.productsNames && Array.isArray(pallet.productsNames)) {
    // Fallback: usar productsNames (sin peso individual)
    productsSummaryArray = pallet.productsNames.map((name) => ({
      name: name,
      netWeight: 0,
      boxCount: 0,
    }));
  }

  const hasMultipleProducts = productsSummaryArray.length > 1;
  const belongsToReception = pallet?.receptionId !== null && pallet?.receptionId !== undefined;

  // Extraer lotes: primero intentar desde pallet.lots, luego desde boxes
  const lots =
    pallet.lots && Array.isArray(pallet.lots) && pallet.lots.length > 0
      ? pallet.lots
      : pallet.boxes && Array.isArray(pallet.boxes)
        ? [...new Set(pallet.boxes.map((box) => box.lot).filter(Boolean))]
        : [];

  return (
    <Card
      className={`bg-card h-fit cursor-pointer overflow-hidden border shadow-md transition-all ${
        isSelected ? 'border-primary border-2 shadow-lg' : 'hover:border-primary/50 border'
      } ${isLinkedToOtherOrder ? 'opacity-50' : ''}`}
      onClick={() => !isLinkedToOtherOrder && onToggleSelection?.()}
    >
      <CardHeader className="flex flex-row items-center justify-between space-x-2 p-4 pb-2">
        <div className="flex flex-1 items-center space-x-2">
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => !isLinkedToOtherOrder && onToggleSelection?.()}
            disabled={isLinkedToOtherOrder}
            onClick={(e) => e.stopPropagation()}
            className="mt-0.5"
          />
          <div className="flex items-center gap-2 rounded-md bg-black p-1.5 text-white">
            <Layers className="h-5 w-5" />
          </div>
          <h3 className="text-foreground text-xl font-medium">Palet #{pallet.id}</h3>
          {pallet.receptionId && (
            <Badge
              variant="outline"
              className="mt-0.5 flex items-center gap-1.5 border-blue-200 bg-blue-50 text-xs text-blue-700"
            >
              <Package className="h-3 w-3" />
              <span>Recepción #{pallet.receptionId}</span>
            </Badge>
          )}
          {isLinkedToOtherOrder && (
            <Badge
              variant="outline"
              className="border-orange-200 bg-orange-50 text-xs text-orange-700"
            >
              Vinculado a otro pedido
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-0">
        <div className="px-1 py-3">
          <div className="text-muted-foreground mb-1.5 text-xs font-medium">Productos:</div>
          <div className="space-y-3">
            {productsSummaryArray.length > 0 ? (
              productsSummaryArray.map((product, index) => (
                <div key={index} className="flex flex-col overflow-hidden">
                  <p className="text-foreground max-w-xs truncate overflow-hidden text-sm font-medium">
                    {product.name}
                  </p>
                  {hasMultipleProducts && (product.netWeight > 0 || product.boxCount > 0) && (
                    <div className="text-muted-foreground mt-1 flex items-center text-xs">
                      {product.netWeight > 0 && (
                        <>
                          <span>{formatDecimalWeight(product.netWeight)} kg</span>
                          {product.boxCount > 0 && <span className="mx-1.5">|</span>}
                        </>
                      )}
                      {product.boxCount > 0 && (
                        <span>
                          {product.boxCount} {product.boxCount === 1 ? 'caja' : 'cajas'}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-sm">Sin productos</p>
            )}
          </div>
        </div>

        {lots.length > 0 && (
          <div className="mb-3">
            <div className="text-muted-foreground mb-1 text-xs font-medium">Lotes:</div>
            <div className="flex max-w-xs flex-wrap gap-1.5 overflow-hidden">
              {lots.map((lot) => (
                <Badge
                  key={lot}
                  variant="outline"
                  className="bg-accent text-accent-foreground border-input text-xs"
                >
                  {lot}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {pallet.observations && (
          <div className="mb-3">
            <div className="text-muted-foreground mb-1 text-xs font-medium">Observaciones:</div>
            <div className="text-foreground bg-muted/50 max-w-xs rounded-md p-2 text-sm break-words">
              {pallet.observations}
            </div>
          </div>
        )}

        {pallet.storedPallet?.store_id && (
          <div className="mb-3">
            <div className="text-muted-foreground mb-1 text-xs font-medium">Almacén:</div>
            <div className="text-foreground text-sm">
              {pallet.storedPallet.position && `${pallet.storedPallet.position} - `}
              {pallet.storedPallet.store_name || `Almacén #${pallet.storedPallet.store_id}`}
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="w-full p-0">
        <div className="divide-border grid w-full grid-cols-2 divide-x">
          <div className="bg-accent/40 flex items-center justify-center py-3">
            <span className="text-base font-semibold">
              {availableBoxCount} {availableBoxCount === 1 ? 'caja' : 'cajas'}
            </span>
          </div>
          <div className="bg-accent/40 flex items-center justify-center py-3">
            <span className="text-base font-semibold">
              {formatDecimalWeight(availableNetWeight)}
            </span>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
