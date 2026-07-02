'use client';

import { TableCell, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Edit, Copy, Unlink, Trash2, Loader2, Printer, EllipsisVertical } from 'lucide-react';
import { formatDecimalWeight } from '@/helpers/formats/numbers/formatNumbers';
import { formatCostPerKg, formatTotalCost } from '@/helpers/production/costFormatters';

interface OrderPalletTableRowData {
  id: number | string;
  productsNames?: string[];
  lots?: string[];
  observations?: string | null;
  numberOfBoxes?: number;
  netWeight?: number;
  costPerKg?: number | null;
  totalCost?: number | null;
  receptionId?: number | string | null;
  [key: string]: unknown;
}

interface OrderPalletTableRowProps {
  pallet: OrderPalletTableRowData;
  onEdit: (palletId: number | string) => void;
  onClone: (palletId: number | string) => void;
  onUnlink: (palletId: number | string) => void;
  onDelete: (palletId: number | string) => void;
  onPrintExpeditionLabel?: (palletId: number | string) => void;
  canPrintExpeditionLabels?: boolean;
  selected?: boolean;
  onToggleSelection?: (palletId: number | string) => void;
  isCloning?: boolean;
  unlinkingPalletId?: number | string | null;
  readOnly?: boolean;
  canViewCostData?: boolean;
}

export default function OrderPalletTableRow({
  pallet,
  onEdit,
  onClone,
  onUnlink,
  onDelete,
  onPrintExpeditionLabel,
  canPrintExpeditionLabels = true,
  selected = false,
  onToggleSelection,
  isCloning,
  unlinkingPalletId,
  readOnly = false,
  canViewCostData = true,
}: OrderPalletTableRowProps) {
  const productNames =
    pallet.productsNames && Array.isArray(pallet.productsNames) && pallet.productsNames.length > 0
      ? pallet.productsNames.join('\n')
      : '';
  const lots =
    pallet.lots && Array.isArray(pallet.lots) && pallet.lots.length > 0
      ? pallet.lots.join(', ')
      : '';
  const observations = pallet.observations || '';
  const belongsToReception = pallet?.receptionId != null;

  const isUnlinking = unlinkingPalletId === pallet.id;
  const canPrint = canPrintExpeditionLabels && Boolean(onPrintExpeditionLabel);
  const hasActions = canPrint || !readOnly;

  return (
    <TableRow className="border-muted hover:bg-muted/20 border-b last:border-0">
      {canPrintExpeditionLabels && (
        <TableCell className="px-4 py-3">
          <Checkbox
            checked={selected}
            onCheckedChange={() => onToggleSelection?.(pallet.id)}
            aria-label={`Seleccionar palet ${pallet.id}`}
          />
        </TableCell>
      )}
      <TableCell className="px-4 py-3">{pallet.id}</TableCell>
      <TableCell className="px-4 py-3 whitespace-pre-wrap">{productNames || '-'}</TableCell>
      <TableCell className="max-w-[150px] truncate px-4 py-3" title={lots}>
        {lots || '-'}
      </TableCell>
      <TableCell className="max-w-[200px] truncate px-4 py-3" title={observations}>
        {observations || '-'}
      </TableCell>
      <TableCell className="px-4 py-3 text-right">{pallet.numberOfBoxes || 0}</TableCell>
      <TableCell className="px-4 py-3 text-right text-nowrap">
        {formatDecimalWeight(pallet.netWeight || 0)}
      </TableCell>
      {canViewCostData && (
        <>
          <TableCell className="px-4 py-3 text-right text-nowrap">
            {formatCostPerKg(pallet.costPerKg)}
          </TableCell>
          <TableCell className="px-4 py-3 text-right text-nowrap">
            {formatTotalCost(pallet.totalCost)}
          </TableCell>
        </>
      )}
      <TableCell className="px-4 py-3">
        <div className="flex justify-end">
          {!hasActions ? (
            <span className="text-muted-foreground text-xs">-</span>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  aria-label={`Acciones del palet ${pallet.id}`}
                >
                  <EllipsisVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {canPrint && (
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={() => onPrintExpeditionLabel?.(pallet.id)}
                  >
                    <Printer className="mr-2 h-4 w-4" />
                    Etiqueta de expedición
                  </DropdownMenuItem>
                )}
                {!readOnly && (
                  <>
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
                      {belongsToReception ? 'Ver palet' : 'Editar palet'}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="cursor-pointer"
                      onClick={() => onClone(pallet.id)}
                      disabled={belongsToReception || isCloning}
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      Clonar palet
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="cursor-pointer"
                      onClick={() => onUnlink(pallet.id)}
                      disabled={isUnlinking}
                    >
                      {isUnlinking ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Unlink className="mr-2 h-4 w-4" />
                      )}
                      Desvincular palet
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      variant="destructive"
                      className="cursor-pointer"
                      onClick={() => onDelete(pallet.id)}
                      disabled={belongsToReception}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Eliminar palet
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}
