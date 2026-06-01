'use client';
import React, { useRef } from 'react';
import { useState } from 'react';
import {
  Box,
  Package,
  Layers,
  X,
  Plus,
  Printer,
  Edit,
  LogOut,
  Eye,
  MapPin,
  MapPinX,
  MapPinHouse,
  ExternalLink,
  Copy,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useStoreContext } from '@/context/StoreContext';
import { useSession } from 'next-auth/react';
import { formatDecimalWeight } from '@/helpers/formats/numbers/formatNumbers';
import {
  getAvailableBoxes,
  getAvailableBoxesCount,
  getAvailableNetWeight,
} from '@/helpers/pallet/boxAvailability';
import { REGISTERED_PALLETS_STORE_ID } from '@/hooks/useStores';
import { isExternalActor } from '@/lib/auth/actor';

export default function PalletCard({ pallet }) {
  const { data: session } = useSession();

  const {
    openPalletDialog,
    isPalletRelevant,
    openPalletLabelDialog,
    openMovePalletToStoreDialog,
    removePalletFromPosition,
    openDuplicatePalletDialog,
    isDuplicatingPallet,
    store,
  } = useStoreContext();

  // Detectar si estamos en el almacén fantasma o si el palet está sin ubicar
  const isGhostStore = store?.id === REGISTERED_PALLETS_STORE_ID;
  const isUnlocated = !pallet.position;
  const shouldHideRemoveOption = isGhostStore || isUnlocated;

  const handleOnCLickEdit = () => {
    openPalletDialog(pallet.id);
  };

  /* Handle on Click quitar elemento de posición */
  const handleOnClickRemovePalletFromPosition = () => {
    removePalletFromPosition(pallet.id);
  };

  const fondoClasses = isPalletRelevant(pallet.id)
    ? 'bg-green-500 text-background border-green-400 dark:border-green-600 overflow-hidden '
    : '' + 'bg-card border-border shadow-md  overflow-hidden';

  /* const hasMultipleProducts = pallet.products.length > 1 */

  const availableBoxCount = getAvailableBoxesCount(pallet);
  const availableNetWeight = getAvailableNetWeight(pallet);

  // Calcular desde boxes (Stores Manager siempre tiene boxes)
  const availableBoxes = getAvailableBoxes(pallet.boxes || []);
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
  const productsSummaryArray = Object.values(productsSummary);

  const hasMultipleProducts = productsSummaryArray.length > 1;

  // Operario no puede reubicar pallets (normalizar por si role viene como array)
  const rawRole = session?.user?.role;
  const isStoreOperator = (Array.isArray(rawRole) ? rawRole[0] : rawRole) === 'operario';
  const externalActor = isExternalActor(session?.user);

  return (
    <Card className={fondoClasses}>
      <CardHeader className="flex flex-row items-center justify-between space-x-2 p-4 pb-2">
        <div className="flex items-center space-x-2">
          <div className="flex items-center gap-2 rounded-md bg-black p-1.5 text-white">
            <Layers className="h-5 w-5" />
          </div>
          <h3 className="text-foreground text-xl font-medium">Palet #{pallet.id}</h3>
          {pallet.receptionId && !externalActor && (
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
          {pallet.orderId && !externalActor && (
            <Badge variant="outline" className="bg-muted text-muted-foreground mt-0.5 text-xs">
              Pedido: #{pallet.orderId}
            </Badge>
          )}
        </div>
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
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => openPalletLabelDialog(pallet.id)}
            >
              <Printer className="mr-2 h-4 w-4" />
              Imprimir etiqueta
            </DropdownMenuItem>
            {/* <DropdownMenuItem>
                            <Eye className="h-4 w-4 mr-2" />
                            Ver detalles
                        </DropdownMenuItem> */}
            <DropdownMenuSeparator />
            {/* Opción Reubicar - Solo visible para usuarios que no son store_operator */}
            {!isStoreOperator && (
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() => openMovePalletToStoreDialog(pallet.id)}
              >
                <MapPinHouse className="mr-2 h-4 w-4" />
                Reubicar
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => openDuplicatePalletDialog(pallet.id)}
              disabled={isDuplicatingPallet}
            >
              <Copy className="mr-2 h-4 w-4" />
              Duplicar
            </DropdownMenuItem>
            {(() => {
              const receptionId = pallet?.receptionId;
              const belongsToReception = receptionId !== null && receptionId !== undefined;
              return (
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={handleOnCLickEdit}
                  title={
                    belongsToReception
                      ? 'Ver palet (solo lectura - pertenece a una recepción)'
                      : undefined
                  }
                >
                  <Edit className="mr-2 h-4 w-4" />
                  {belongsToReception ? 'Ver palet' : 'Editar'}
                </DropdownMenuItem>
              );
            })()}
            {/* Solo mostrar "Quitar de esta posición" si NO es almacén fantasma y NO está sin ubicar */}
            {!shouldHideRemoveOption && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleOnClickRemovePalletFromPosition}
                  className="text-destructive focus:text-destructive cursor-pointer"
                >
                  <MapPinX className="mr-2 h-4 w-4" />
                  Quitar de esta posición
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>

      <CardContent className="p-4 pt-0">
        <div className="px-1 py-3">
          <div className="text-muted-foreground mb-1.5 text-xs font-medium">Productos:</div>
          <div className="space-y-3">
            {productsSummaryArray.map((product, index) => (
              <div key={index} className="flex flex-col overflow-hidden">
                <p className="text-foreground max-w-xs truncate overflow-hidden text-sm font-medium">
                  {product.name}
                </p>
                {hasMultipleProducts && (product.weight || product.boxCount) && (
                  <div className="text-muted-foreground mt-1 flex items-center text-xs">
                    <span>{formatDecimalWeight(product.netWeight)} kg</span>
                    <span className="mx-1.5">|</span>
                    {product.boxCount && (
                      <span>
                        {product.boxCount} {product.boxCount === 1 ? 'caja' : 'cajas'}
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

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

        {pallet.observations && (
          <div className="mb-3">
            <div className="text-muted-foreground mb-1 text-xs font-medium">Observaciones:</div>
            <div className="text-foreground bg-muted/50 max-w-xs rounded-md p-2 text-sm break-words">
              {pallet.observations}
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
