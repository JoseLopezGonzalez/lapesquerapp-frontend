'use client';

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
import { Loader2, Trash2, Unlink, ArrowRightLeft } from 'lucide-react';

export type ConfirmActionDialogAction =
  | 'delete'
  | 'unlink'
  | 'unlinkAll'
  | 'deleteSelected'
  | 'unlinkSelected'
  | 'assignToContainer';

interface ConfirmActionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action: ConfirmActionDialogAction | null;
  palletId?: number | string | null;
  onConfirm: () => void;
  onCancel: () => void;
  isUnlinking?: boolean;
  unlinkAllCount?: number;
  selectedCount?: number;
  isProcessing?: boolean;
  /** Nº de contenedor destino y cuántos de los seleccionados ya tenían otro contenedor — solo para `assignToContainer` */
  targetContainerNumber?: string;
  reassignCount?: number;
}

function pluralizePallets(count: number): string {
  return `${count} palet${count === 1 ? '' : 's'} seleccionado${count === 1 ? '' : 's'}`;
}

export default function ConfirmActionDialog({
  open,
  onOpenChange: _onOpenChange,
  action,
  palletId,
  onConfirm,
  onCancel,
  isUnlinking,
  unlinkAllCount,
  selectedCount,
  isProcessing,
  targetContainerNumber,
  reassignCount,
}: ConfirmActionDialogProps) {
  const isDelete = action === 'delete';
  const isDeleteSelected = action === 'deleteSelected';
  const isUnlinkAll = action === 'unlinkAll';
  const isUnlinkSelected = action === 'unlinkSelected';
  const isAssignToContainer = action === 'assignToContainer';
  const isDestructive = isDelete || isDeleteSelected;
  const isBulkAction = isDeleteSelected || isUnlinkSelected || isAssignToContainer;
  const busy = isBulkAction ? !!isProcessing : !!isUnlinking;

  const palletLabel = palletId != null ? `el palet #${palletId}` : 'el palet';
  const selectedLabel = pluralizePallets(selectedCount ?? 0);
  const reassignLabel = pluralizePallets(reassignCount ?? 0);

  const totalCount = selectedCount ?? 0;
  const totalLabel = `${totalCount} palet${totalCount === 1 ? '' : 's'}`;

  const title = isDelete
    ? `¿Eliminar ${palletLabel}?`
    : isDeleteSelected
      ? `¿Eliminar ${selectedLabel}?`
      : isUnlinkAll
        ? '¿Desvincular todos los palets?'
        : isUnlinkSelected
          ? `¿Desvincular ${selectedLabel}?`
          : isAssignToContainer
            ? `¿Asignar ${totalLabel} a ${targetContainerNumber ?? 'el contenedor seleccionado'}?`
            : `¿Desvincular ${palletLabel}?`;

  const description = isDelete
    ? `¿Estás seguro de que quieres eliminar ${palletLabel}? Esta acción no se puede deshacer.`
    : isDeleteSelected
      ? `¿Estás seguro de que quieres eliminar ${selectedLabel}? Esta acción no se puede deshacer.`
      : isUnlinkAll
        ? typeof unlinkAllCount === 'number' && unlinkAllCount > 0
          ? `¿Estás seguro de que quieres desvincular los ${unlinkAllCount} palet${unlinkAllCount === 1 ? '' : 's'} de este pedido? Los palets permanecerán en el almacén pero ya no estarán asociados a este pedido. Esta acción no se puede deshacer.`
          : '¿Estás seguro de que quieres desvincular todos los palets de este pedido? Los palets permanecerán en el almacén pero ya no estarán asociados a este pedido. Esta acción no se puede deshacer.'
        : isUnlinkSelected
          ? `¿Estás seguro de que quieres desvincular ${selectedLabel} de este pedido? Los palets permanecerán en el almacén pero ya no estarán asociados a este pedido. Esta acción no se puede deshacer.`
          : isAssignToContainer
            ? `Vas a asignar ${totalLabel} a ${targetContainerNumber ?? 'el contenedor seleccionado'}.${
                (reassignCount ?? 0) > 0
                  ? ` ${reassignLabel} ya ${(reassignCount ?? 0) === 1 ? 'está asignado' : 'están asignados'} a otro contenedor y se ${(reassignCount ?? 0) === 1 ? 'moverá' : 'moverán'}.`
                  : ''
              } Los palets siguen vinculados al pedido.`
            : `¿Estás seguro de que quieres desvincular ${palletLabel} del pedido? El palet permanecerá en el almacén pero ya no estará asociado a este pedido. Esta acción no se puede deshacer.`;

  const confirmLabel = isDestructive
    ? 'Eliminar'
    : isUnlinkAll
      ? 'Desvincular todos'
      : isAssignToContainer
        ? 'Reasignar'
        : 'Desvincular';

  const busyLabel = isDestructive
    ? 'Eliminando...'
    : isAssignToContainer
      ? 'Reasignando...'
      : 'Desvinculando...';

  return (
    <AlertDialog open={open} onOpenChange={onCancel}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            {isDestructive ? (
              <Trash2 className="h-5 w-5 text-red-600" />
            ) : isAssignToContainer ? (
              <ArrowRightLeft className="h-5 w-5 text-blue-600" />
            ) : (
              <Unlink className="h-5 w-5 text-orange-600" />
            )}
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            variant={isDestructive ? 'destructive' : 'default'}
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {busyLabel}
              </>
            ) : (
              confirmLabel
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
