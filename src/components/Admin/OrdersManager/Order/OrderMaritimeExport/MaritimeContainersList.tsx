'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/Utilities/EmptyState';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Loader2, Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { PiShippingContainer } from 'react-icons/pi';
import { useIsMobileSafe } from '@/hooks/use-mobile';
import { useOrderMaritimeContainers } from '@/hooks/orders/useOrderMaritimeContainers';
import {
  maritimeContainerSchema,
  type MaritimeContainerFormData,
} from './schemas/maritimeContainerSchema';
import type { MaritimeContainer } from '@/types/orders';

interface MaritimeContainersListProps {
  orderId: number | string | null | undefined;
  readOnly?: boolean;
}

export default function MaritimeContainersList({
  orderId,
  readOnly = false,
}: MaritimeContainersListProps) {
  const { containers, isLoading, error, refetch, createMutation, updateMutation, deleteMutation } =
    useOrderMaritimeContainers(orderId);
  const { isMobile } = useIsMobileSafe();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingContainer, setEditingContainer] = useState<MaritimeContainer | null>(null);
  const [deletingContainer, setDeletingContainer] = useState<MaritimeContainer | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MaritimeContainerFormData>({
    resolver: zodResolver(maritimeContainerSchema),
    defaultValues: { containerNumber: '', sealNumber: '' },
  });

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const openCreateDialog = () => {
    setEditingContainer(null);
    reset({ containerNumber: '', sealNumber: '' });
    setDialogOpen(true);
  };

  const openEditDialog = (container: MaritimeContainer) => {
    setEditingContainer(container);
    reset({ containerNumber: container.containerNumber, sealNumber: container.sealNumber ?? '' });
    setDialogOpen(true);
  };

  const onSubmit = handleSubmit(async (data) => {
    const payload = { containerNumber: data.containerNumber, sealNumber: data.sealNumber || null };
    if (editingContainer) {
      await updateMutation.mutateAsync({ containerId: editingContainer.id, payload });
    } else {
      await createMutation.mutateAsync(payload);
    }
    setDialogOpen(false);
  });

  const handleConfirmDelete = async () => {
    if (!deletingContainer) return;
    await deleteMutation.mutateAsync(deletingContainer.id);
    setDeletingContainer(null);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <div className="min-w-0">
          <CardTitle className="text-lg font-medium">Contenedores</CardTitle>
          <CardDescription>Contenedores asociados a esta exportación.</CardDescription>
        </div>
        {!readOnly && !error && (
          <Button type="button" onClick={openCreateDialog} className="shrink-0">
            <Plus />
            Añadir contenedor
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="grid gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-lg" />
            ))}
          </div>
        ) : error ? (
          // No tratar un error de carga como "sin contenedores": si la lista real no está vacía,
          // el usuario podría añadir un contenedor duplicado creyendo que este es el primero.
          <div className="flex flex-col items-center gap-3 p-4 text-center">
            <p className="text-sm text-red-500">
              No se pudieron cargar los contenedores. Reintenta antes de añadir uno nuevo.
            </p>
            <Button type="button" variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw />
              Reintentar
            </Button>
          </div>
        ) : containers.length === 0 ? (
          <EmptyState
            className="py-8"
            title="Sin contenedores registrados"
            description="Añade el primer contenedor de esta exportación."
          />
        ) : (
          <div className="grid gap-2">
            {containers.map((container) => (
              <div
                key={container.id}
                className="flex items-center justify-between gap-3 rounded-lg border p-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <PiShippingContainer className="text-muted-foreground size-5 shrink-0" />
                  <div className="min-w-0">
                    <p className="min-w-0 truncate text-sm font-medium">
                      {container.containerNumber}
                    </p>
                    <p className="text-muted-foreground min-w-0 truncate text-xs">
                      {container.sealNumber ? `Precinto: ${container.sealNumber}` : 'Sin precinto'}
                    </p>
                  </div>
                </div>
                {!readOnly && (
                  <div className="flex shrink-0 gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label="Editar contenedor"
                      onClick={() => openEditDialog(container)}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label="Eliminar contenedor"
                      onClick={() => setDeletingContainer(container)}
                    >
                      <Trash2 className="text-destructive size-4" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          className={
            isMobile ? 'm-0 flex h-full max-h-full w-full max-w-full flex-col rounded-none' : undefined
          }
        >
          <DialogHeader className={isMobile ? 'text-center' : ''}>
            <DialogTitle className={isMobile ? 'justify-center' : ''}>
              {editingContainer ? 'Editar contenedor' : 'Añadir contenedor'}
            </DialogTitle>
            <DialogDescription>
              Número de contenedor y precinto de esta exportación marítima.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={onSubmit}
            className={isMobile ? 'flex flex-1 flex-col' : 'grid gap-4'}
            noValidate
          >
            <div
              className={isMobile ? 'flex flex-1 flex-col justify-center gap-4' : 'grid gap-4'}
            >
              <div className="grid gap-2">
                <Label htmlFor="containerNumber">Número de contenedor</Label>
                <Input
                  id="containerNumber"
                  placeholder="ej. MSKU1234567"
                  disabled={isSaving}
                  aria-invalid={!!errors.containerNumber}
                  {...register('containerNumber')}
                />
                {errors.containerNumber && (
                  <p className="pt-1 text-xs text-red-400">* {errors.containerNumber.message}</p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="sealNumber">Número de precinto</Label>
                <Input
                  id="sealNumber"
                  placeholder="ej. SL987654"
                  disabled={isSaving}
                  aria-invalid={!!errors.sealNumber}
                  {...register('sealNumber')}
                />
                {errors.sealNumber && (
                  <p className="pt-1 text-xs text-red-400">* {errors.sealNumber.message}</p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="animate-spin" />}
                Guardar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deletingContainer}
        onOpenChange={(open) => !open && setDeletingContainer(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar contenedor?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará el contenedor {deletingContainer?.containerNumber}. Esta acción no se
              puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingContainer(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleConfirmDelete}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
