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
import { Loader2, Trash2, Unlink } from 'lucide-react';

export default function ConfirmActionDialog({
  open,
  onOpenChange,
  action,
  onConfirm,
  onCancel,
  isUnlinking,
  unlinkAllCount,
}) {
  const isDelete = action === 'delete';
  const isUnlinkAll = action === 'unlinkAll';

  const title = isDelete
    ? 'Eliminar Palet'
    : isUnlinkAll
      ? 'Desvincular todos los palets'
      : 'Desvincular Palet';

  const description = isDelete
    ? '¿Estás seguro de que quieres eliminar este palet? Esta acción no se puede deshacer.'
    : isUnlinkAll
      ? typeof unlinkAllCount === 'number' && unlinkAllCount > 0
        ? `¿Estás seguro de que quieres desvincular los ${unlinkAllCount} palet${unlinkAllCount === 1 ? '' : 's'} de este pedido? Los palets permanecerán en el almacén pero ya no estarán asociados a este pedido.`
        : '¿Estás seguro de que quieres desvincular todos los palets de este pedido? Los palets permanecerán en el almacén pero ya no estarán asociados a este pedido.'
      : '¿Estás seguro de que quieres desvincular este palet del pedido? El palet permanecerá en el almacén pero ya no estará asociado a este pedido.';

  const confirmLabel = isDelete ? 'Eliminar' : isUnlinkAll ? 'Desvincular todos' : 'Desvincular';

  return (
    <AlertDialog open={open} onOpenChange={onCancel}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            {isDelete ? (
              <Trash2 className="h-5 w-5 text-red-600" />
            ) : (
              <Unlink className="h-5 w-5 text-orange-600" />
            )}
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isUnlinking}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            variant={isDelete ? 'destructive' : 'default'}
            onClick={onConfirm}
            disabled={isUnlinking}
          >
            {isUnlinking ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Desvinculando...
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
