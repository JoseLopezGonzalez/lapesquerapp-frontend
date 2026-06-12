'use client';

import React, { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useSession } from 'next-auth/react';
import { useMutation } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useSpeciesOptions } from '@/hooks/useSpeciesOptions';
import { useCaptureZoneOptions } from '@/hooks/useProductBlockCatalogOptions';
import { updateProduction } from '@/services/productionService';
import { ApiError, getErrorMessage } from '@/lib/api/apiHelpers';
import { setErrorsFrom422 } from '@/lib/validation/setErrorsFrom422';
import { notify } from '@/lib/notifications';
import { Loader2, Lock } from 'lucide-react';

const EMPTY_OPTION = '__none__';

function normalizeSelectOptions(options) {
  if (!Array.isArray(options)) return [];

  return options
    .map((option, index) => {
      if (!option) return null;

      const rawValue = option.value ?? option.id ?? null;
      const rawLabel = option.label ?? option.name ?? null;

      if (rawValue === null || rawValue === undefined) return null;

      return {
        value: String(rawValue),
        label: rawLabel || `Opción ${index + 1}`,
        key: `${String(rawValue)}-${rawLabel || index}-${index}`,
      };
    })
    .filter(Boolean);
}

function getDefaultValues(production) {
  return {
    lot: production?.lot ?? '',
    speciesId: production?.species?.id != null ? String(production.species.id) : EMPTY_OPTION,
    captureZoneId:
      production?.captureZone?.id != null ? String(production.captureZone.id) : EMPTY_OPTION,
    notes: production?.notes ?? '',
  };
}

export default function EditProductionHeaderDialog({ open, onOpenChange, production, onSaved }) {
  const { data: session } = useSession();
  const token = session?.user?.accessToken;
  const isClosed = production?.isClosed === true;
  const { data: speciesOptions = [], isLoading: speciesLoading } = useSpeciesOptions();
  const { data: captureZoneOptions = [], isLoading: captureZonesLoading } = useCaptureZoneOptions();
  const normalizedSpeciesOptions = normalizeSelectOptions(speciesOptions);
  const normalizedCaptureZoneOptions = normalizeSelectOptions(captureZoneOptions);

  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { isDirty, errors },
  } = useForm({
    defaultValues: getDefaultValues(production),
  });

  useEffect(() => {
    if (open) {
      reset(getDefaultValues(production));
    }
  }, [open, production, reset]);

  const updateMutation = useMutation({
    mutationFn: async (values) => {
      if (!token || !production?.id) {
        throw new Error('No se pudo autenticar la actualización de la producción');
      }

      if (isClosed) {
        throw new Error(
          'La producción está cerrada definitivamente. Reábrela antes de realizar cambios.'
        );
      }

      const payload = {
        lot: values.lot?.trim() || null,
        species_id: values.speciesId !== EMPTY_OPTION ? Number(values.speciesId) : null,
        capture_zone_id:
          values.captureZoneId !== EMPTY_OPTION ? Number(values.captureZoneId) : null,
        notes: values.notes?.trim() || null,
      };

      return updateProduction(production.id, payload, token);
    },
    onSuccess: async () => {
      notify.success('Cabecera de producción actualizada');
      onOpenChange(false);
      reset(getDefaultValues(production));
      if (onSaved) {
        await onSaved();
      }
    },
    onError: (error) => {
      if (error instanceof ApiError && error.status === 422 && error.data?.errors) {
        setErrorsFrom422(setError, error.data.errors);
      } else {
        notify.error(error instanceof ApiError ? getErrorMessage(error.data) : error?.message);
      }
    },
  });

  const onSubmit = handleSubmit((values) => updateMutation.mutate(values));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg" className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar cabecera de producción</DialogTitle>
          <DialogDescription>Actualiza los datos principales de la producción.</DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          {isClosed && (
            <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              <Lock className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <p>La producción está cerrada definitivamente. Reábrela antes de realizar cambios.</p>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="production-lot">Lote</Label>
              <Input
                id="production-lot"
                placeholder="Introduce el lote"
                disabled={isClosed || updateMutation.isPending}
                aria-invalid={!!errors.lot}
                {...register('lot')}
              />
              {errors.lot && (
                <p className="text-xs text-red-400">* {errors.lot.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Especie</Label>
              <Controller
                name="speciesId"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isClosed || speciesLoading || updateMutation.isPending}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue
                        placeholder={
                          speciesLoading ? 'Cargando especies...' : 'Selecciona una especie'
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={EMPTY_OPTION}>Sin especie</SelectItem>
                      {normalizedSpeciesOptions.map((option) => (
                        <SelectItem key={`species-${option.key}`} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label>Zona de captura</Label>
              <Controller
                name="captureZoneId"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isClosed || captureZonesLoading || updateMutation.isPending}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue
                        placeholder={
                          captureZonesLoading ? 'Cargando zonas...' : 'Selecciona una zona'
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={EMPTY_OPTION}>Sin zona</SelectItem>
                      {normalizedCaptureZoneOptions.map((option) => (
                        <SelectItem key={`capture-zone-${option.key}`} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="production-notes">Notas</Label>
              <Textarea
                id="production-notes"
                rows={5}
                placeholder="Añade notas para esta producción"
                disabled={isClosed || updateMutation.isPending}
                {...register('notes')}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={updateMutation.isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isClosed || !isDirty || updateMutation.isPending}>
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando
                </>
              ) : (
                'Guardar cambios'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
