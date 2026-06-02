'use client';

import {
  Package,
  Layers,
  Printer,
  Edit,
  MapPinHouse,
  MapPinX,
  Copy,
  ExternalLink,
  Eye,
  MoreVertical,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
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
import { cn } from '@/lib/utils';

interface PalletCardProps {
  pallet: {
    id: string | number;
    position?: string | null;
    receptionId?: string | number | null;
    orderId?: string | number | null;
    lots: string[];
    observations?: string | null;
    boxes?: unknown[];
    [key: string]: unknown;
  };
}

export default function PalletCard({ pallet }: PalletCardProps) {
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

  const isGhostStore = store?.id === REGISTERED_PALLETS_STORE_ID;
  const isUnlocated = !pallet.position;
  const shouldHideRemoveOption = isGhostStore || isUnlocated;
  const isRelevant = isPalletRelevant(pallet.id);

  const rawRole = session?.user?.role;
  const isStoreOperator = (Array.isArray(rawRole) ? rawRole[0] : rawRole) === 'operario';
  const externalActor = isExternalActor(session?.user);

  const availableBoxCount = getAvailableBoxesCount(pallet);
  const availableNetWeight = getAvailableNetWeight(pallet);
  const availableBoxes = getAvailableBoxes(pallet.boxes || []) as {
    product: { id: string | number; name: string };
    netWeight: string | number;
  }[];

  const productsSummary = availableBoxes.reduce(
    (acc: Record<string | number, { name: string; netWeight: number; boxCount: number }>, box) => {
      const product = box.product;
      if (!product?.id) return acc;
      if (!acc[product.id]) {
        acc[product.id] = { name: product.name || '', netWeight: 0, boxCount: 0 };
      }
      acc[product.id].netWeight += Number(box.netWeight || 0);
      acc[product.id].boxCount += 1;
      return acc;
    },
    {}
  );
  const productsSummaryArray = Object.values(productsSummary);
  const hasMultipleProducts = productsSummaryArray.length > 1;

  const receptionId = pallet.receptionId;
  const belongsToReception = receptionId !== null && receptionId !== undefined;

  return (
    <div
      className={cn(
        'overflow-hidden rounded-2xl border bg-card shadow-sm',
        isRelevant
          ? 'border-green-400/60 ring-2 ring-green-400/30 dark:border-green-500/60'
          : 'border-border'
      )}
    >
      {/* Header */}
      <div
        className={cn(
          'flex items-start justify-between gap-2 px-4 py-3',
          isRelevant
            ? 'bg-green-500 text-white'
            : 'bg-muted/40'
        )}
      >
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <div
            className={cn(
              'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg',
              isRelevant ? 'bg-white/20' : 'bg-foreground'
            )}
          >
            <Layers className={cn('h-4 w-4', isRelevant ? 'text-white' : 'text-background')} />
          </div>
          <div className="min-w-0">
            <p
              className={cn(
                'text-base font-semibold leading-tight',
                isRelevant ? 'text-white' : 'text-foreground'
              )}
            >
              Palet #{pallet.id}
            </p>
            {/* Badges */}
            {(receptionId || pallet.orderId) && (
              <div className="mt-1 flex flex-wrap gap-1">
                {receptionId && !externalActor && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Link
                          href={`/admin/raw-material-receptions/${receptionId}/edit`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Badge
                            variant="outline"
                            className={cn(
                              'flex cursor-pointer items-center gap-1 text-xs',
                              isRelevant
                                ? 'border-white/30 bg-white/20 text-white hover:bg-white/30'
                                : 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100'
                            )}
                          >
                            <Package className="h-2.5 w-2.5" />
                            Rec. #{receptionId}
                            <ExternalLink className="h-2.5 w-2.5" />
                          </Badge>
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent>Ver recepción #{receptionId}</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                {pallet.orderId && !externalActor && (
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-xs',
                      isRelevant
                        ? 'border-white/30 bg-white/20 text-white'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    Pedido #{pallet.orderId}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Actions menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                'h-8 w-8 flex-shrink-0',
                isRelevant
                  ? 'text-white hover:bg-white/20 hover:text-white'
                  : 'text-muted-foreground'
              )}
            >
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">Acciones</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem onClick={() => openPalletLabelDialog(pallet.id)}>
              <Printer className="mr-2 h-4 w-4" />
              Imprimir etiqueta
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {!isStoreOperator && (
              <DropdownMenuItem onClick={() => openMovePalletToStoreDialog(pallet.id)}>
                <MapPinHouse className="mr-2 h-4 w-4" />
                Reubicar
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              onClick={() => openDuplicatePalletDialog(pallet.id)}
              disabled={isDuplicatingPallet}
            >
              <Copy className="mr-2 h-4 w-4" />
              Duplicar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => openPalletDialog(pallet.id)}>
              {belongsToReception ? (
                <>
                  <Eye className="mr-2 h-4 w-4" />
                  Ver palet
                </>
              ) : (
                <>
                  <Edit className="mr-2 h-4 w-4" />
                  Editar
                </>
              )}
            </DropdownMenuItem>
            {!shouldHideRemoveOption && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => removePalletFromPosition(pallet.id)}
                  className="text-destructive focus:text-destructive"
                >
                  <MapPinX className="mr-2 h-4 w-4" />
                  Quitar de posición
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Body */}
      <div className="space-y-3 px-4 py-3">
        {/* Products */}
        <div>
          <p className="text-muted-foreground mb-1.5 text-[10px] font-semibold uppercase tracking-wider">
            Productos
          </p>
          <div className="space-y-1.5">
            {productsSummaryArray.map((product, i) => (
              <div key={i} className="flex items-start gap-2">
                <div className="bg-foreground/8 mt-0.5 h-1.5 w-1.5 flex-shrink-0 rounded-full" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium leading-tight">{product.name}</p>
                  {hasMultipleProducts && (
                    <p className="text-muted-foreground mt-0.5 text-xs">
                      {formatDecimalWeight(product.netWeight)}
                      <span className="mx-1 opacity-40">·</span>
                      {product.boxCount} {product.boxCount === 1 ? 'caja' : 'cajas'}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Lots */}
        {pallet.lots?.length > 0 && (
          <div>
            <p className="text-muted-foreground mb-1.5 text-[10px] font-semibold uppercase tracking-wider">
              Lotes
            </p>
            <div className="flex flex-wrap gap-1">
              {pallet.lots.map((lot) => (
                <Badge
                  key={lot}
                  variant="outline"
                  className="bg-accent/60 text-accent-foreground border-border/60 text-xs"
                >
                  {lot}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Observations */}
        {pallet.observations && (
          <div>
            <p className="text-muted-foreground mb-1 text-[10px] font-semibold uppercase tracking-wider">
              Obs.
            </p>
            <p className="text-muted-foreground line-clamp-2 text-xs leading-relaxed">
              {pallet.observations}
            </p>
          </div>
        )}
      </div>

      {/* Stats footer */}
      <div className="grid grid-cols-2 divide-x border-t">
        <div className="flex items-center justify-center gap-1.5 py-2.5">
          <span className="text-sm font-semibold tabular-nums">
            {availableBoxCount}
          </span>
          <span className="text-muted-foreground text-xs">
            {availableBoxCount === 1 ? 'caja' : 'cajas'}
          </span>
        </div>
        <div className="flex items-center justify-center gap-1.5 py-2.5">
          <span className="text-sm font-semibold tabular-nums">
            {formatDecimalWeight(availableNetWeight)}
          </span>
        </div>
      </div>
    </div>
  );
}
