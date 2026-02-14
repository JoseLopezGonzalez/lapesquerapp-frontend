'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Trash2, Unlink, Loader2 } from 'lucide-react';

export default function ConfirmActionDialog({
  open,
  onOpenChange,
  action,
  onConfirm,
  onCancel,
  isUnlinking,
}) {
  const isDelete = action === 'delete';

  return (
    <Dialog open={open} onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isDelete ? (
              <Trash2 className="h-5 w-5 text-red-600" />
            ) : (
              <Unlink className="h-5 w-5 text-orange-600" />
            )}
            {isDelete ? 'Eliminar Palet' : 'Desvincular Palet'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {isDelete
              ? '¿Estás seguro de que quieres eliminar este palet? Esta acción no se puede deshacer.'
              : '¿Estás seguro de que quieres desvincular este palet del pedido? El palet permanecerá en el almacén pero ya no estará asociado a este pedido.'}
          </p>
        </div>
        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onCancel} disabled={isUnlinking}>
            Cancelar
          </Button>
          <Button
            variant={isDelete ? 'destructive' : 'default'}
            onClick={onConfirm}
            disabled={isUnlinking}
          >
            {isUnlinking ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Desvinculando...
              </>
            ) : (
              isDelete ? 'Eliminar' : 'Desvincular'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
