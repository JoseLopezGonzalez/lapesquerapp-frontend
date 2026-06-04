'use client';
import React from 'react';
import { Layers, Package, Printer, Edit, Copy, Unlink, Trash2, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { formatDecimalWeight } from '@/helpers/formats/numbers/formatNumbers';
import { formatCostPerKg, formatTotalCost } from '@/helpers/production/costFormatters';
import {
  getAvailableBoxes,
  getAvailableBoxesCount,
  getAvailableNetWeight,
} from '@/helpers/pallet/boxAvailability';
import { PalletImageStrip } from '@/components/Admin/Pallets/PalletAttachments/PalletImageStrip';

export default function OrderPalletCard({
  pallet,
  onEdit,
  onClone,
  onUnlink,
  onDelete,
  onPrintLabel,
  onPrintExpeditionLabel,
  canPrintExpeditionLabels = true,
  selected = false,
  onToggleSelection,
  isCloning = false,
  isUnlinking = false,
  readOnly = false,
}) {
  // Los palets vinculados al pedido NO tienen productsSummary (solo los resultados de búsqueda lo tienen)
  // Calcular desde boxes o usar productsNames como fallback
  const availableBoxCount = getAvailableBoxesCount(pallet);
  const availableNetWeight = getAvailableNetWeight(pallet);

  let productsSummaryArray = [];
  if (pallet.boxes && Array.isArray(pallet.boxes)) {
    // Calcular desde boxes
    const availableBoxes = (pallet.boxes || []).filter((box) => box.isAvailable !== false);
    const productsSummary = availableBoxes.reduce((acc, box) => {
      const product = box.product;
      if (!product || !product.id) return acc;
      if (!acc[product.id]) {
        acc[product.id] = {
          name: product.name || '',
          netWeight: 0,
          boxCount: 0,
        };
      }
      acc[product.id].netWeight += Number(box.netWeight || 0);
      acc[product.id].boxCount += 1;
      return acc;
    }, {});
    productsSummaryArray = Object.values(productsSummary);
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

  return (
    <Card className="bg-card border-border overflow-hidden shadow-md">
      <CardHeader className="flex flex-row items-center justify-between space-x-2 p-4 pb-2">
        <div className="flex min-w-0 items-center space-x-2">
          {canPrintExpeditionLabels && (
            <Checkbox
              checked={selected}
              onCheckedChange={() => onToggleSelection?.(pallet.id)}
              aria-label={`Seleccionar palet ${pallet.id}`}
            />
          )}
          <div className="flex items-center gap-2 rounded-md bg-black p-1.5 text-white">
            <Layers className="h-5 w-5" />
          </div>
          <h3 className="text-foreground truncate text-xl font-medium">Palet #{pallet.id}</h3>
          {pallet.receptionId && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href={`/admin/raw-material-receptions/${pallet.receptionId}/edit`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Badge
                      variant="outline"
                      className="mt-0.5 flex cursor-pointer items-center gap-1.5 border-blue-200 bg-blue-50 text-xs text-blue-700 transition-colors hover:bg-blue-100 hover:text-blue-800"
                    >
                      <Package className="h-3 w-3" />
                      <span>Recepción #{pallet.receptionId}</span>
                      <ExternalLink className="h-3 w-3" />
                    </Badge>
                  </Link>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Ver recepción #{pallet.receptionId}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        <div className="flex items-center gap-1">
          {canPrintExpeditionLabels && onPrintExpeditionLabel && (
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground h-8 w-8"
              onClick={() => onPrintExpeditionLabel(pallet.id)}
              aria-label={`Etiqueta de expedición del palet ${pallet.id}`}
            >
              <Printer className="h-4 w-4" />
            </Button>
          )}
          {!readOnly && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="text-muted-foreground h-8 w-8">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4"
                  >
                    <circle cx="12" cy="12" r="1" />
                    <circle cx="12" cy="5" r="1" />
                    <circle cx="12" cy="19" r="1" />
                  </svg>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                {onPrintLabel && (
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={() => onPrintLabel(pallet.id)}
                  >
                    <Printer className="mr-2 h-4 w-4" />
                    Imprimir etiqueta
                  </DropdownMenuItem>
                )}

                <>
                  {onPrintLabel && <DropdownMenuSeparator />}
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={() => onClone(pallet.id)}
                    disabled={belongsToReception || isCloning}
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Clonar
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={() => onEdit(pallet.id)}
                    title={
                      belongsToReception
                        ? 'Ver palet (solo lectura - pertenece a una recepción)'
                        : undefined
                    }
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    {belongsToReception ? 'Ver palet' : 'Editar'}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onUnlink(pallet.id)}
                    disabled={isUnlinking}
                    className="cursor-pointer"
                  >
                    <Unlink className="mr-2 h-4 w-4" />
                    Desvincular
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onDelete(pallet.id)}
                    disabled={belongsToReception}
                    className="text-destructive focus:text-destructive cursor-pointer"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Eliminar
                  </DropdownMenuItem>
                </>
              </DropdownMenuContent>
            </DropdownMenu>
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

        {pallet.lots && Array.isArray(pallet.lots) && pallet.lots.length > 0 && (
          <div className="mb-3">
            <div className="text-muted-foreground mb-1 text-xs font-medium">Lotes:</div>
            <div className="flex max-w-xs flex-wrap gap-1.5 overflow-hidden">
              {pallet.lots.map((lot) => (
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

        <div className="grid grid-cols-2 gap-3 pt-1">
          <div>
            <div className="text-muted-foreground mb-1 text-xs font-medium">Coste €/kg:</div>
            <div className="text-foreground text-sm font-medium">
              {formatCostPerKg(pallet.costPerKg)}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground mb-1 text-xs font-medium">Coste total:</div>
            <div className="text-foreground text-sm font-medium">
              {formatTotalCost(pallet.totalCost)}
            </div>
          </div>
        </div>
      </CardContent>

      <PalletImageStrip palletId={pallet.id} />

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
