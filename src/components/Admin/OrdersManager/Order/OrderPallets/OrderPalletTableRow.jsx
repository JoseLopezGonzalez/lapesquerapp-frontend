'use client';

import { TableCell, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Edit, Copy, Unlink, Trash2, Loader2 } from 'lucide-react';
import { formatDecimalWeight } from '@/helpers/formats/numbers/formatNumbers';

export default function OrderPalletTableRow({
  pallet,
  onEdit,
  onClone,
  onUnlink,
  onDelete,
  isCloning,
  unlinkingPalletId,
}) {
  const productNames = pallet.productsNames && Array.isArray(pallet.productsNames) && pallet.productsNames.length > 0
    ? pallet.productsNames.join('\n')
    : '';
  const lots = pallet.lots && Array.isArray(pallet.lots) && pallet.lots.length > 0
    ? pallet.lots.join(', ')
    : '';
  const observations = pallet.observations || '';
  const belongsToReception = pallet?.receptionId != null;

  const isUnlinking = unlinkingPalletId === pallet.id;

  return (
    <TableRow className="border-b border-muted last:border-0 hover:bg-muted/20">
      <TableCell className="px-4 py-3">{pallet.id}</TableCell>
      <TableCell className="px-4 py-3 whitespace-pre-wrap">{productNames || '-'}</TableCell>
      <TableCell className="px-4 py-3 max-w-[150px] truncate" title={lots}>
        {lots || '-'}
      </TableCell>
      <TableCell className="px-4 py-3 max-w-[200px] truncate" title={observations}>
        {observations || '-'}
      </TableCell>
      <TableCell className="px-4 py-3 text-right">{pallet.numberOfBoxes || 0}</TableCell>
      <TableCell className="px-4 py-3 text-right text-nowrap">
        {formatDecimalWeight(pallet.netWeight || 0)}
      </TableCell>
      <TableCell className="px-4 py-3">
        <div className="flex justify-end gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={() => onEdit(pallet.id)}
                title={belongsToReception ? "Ver palet (solo lectura - pertenece a una recepción)" : "Editar palet"}
              >
                <Edit className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{belongsToReception ? "Ver palet" : "Editar palet"}</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={() => onClone(pallet.id)}
                disabled={belongsToReception || isCloning}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Clonar palet</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={() => onUnlink(pallet.id)}
                disabled={isUnlinking}
              >
                {isUnlinking ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Unlink className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Desvincular palet</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={() => onDelete(pallet.id)}
                disabled={belongsToReception}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Eliminar palet</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </TableCell>
    </TableRow>
  );
}
