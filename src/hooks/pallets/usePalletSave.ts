'use client';

import { createPallet, updatePallet } from '@/services/palletService';
import { notify } from '@/lib/notifications';
import { canManagePalletCostFields } from '@/lib/auth/actor';
import { stripPalletCostFieldsFromPayload } from '@/helpers/pallet/stripCostFieldsForApi';
import { PalletState, BoxCreationData, saveDiscountPreferences } from './palletHelpers';

interface UsePalletSaveParams {
  temporalPallet: PalletState | null;
  setPallet: React.Dispatch<React.SetStateAction<PalletState | null>>;
  setSaving: React.Dispatch<React.SetStateAction<boolean>>;
  onChange: (pallet: PalletState) => void;
  skipBackendSave: boolean;
  session: { user?: unknown } | null;
  boxCreationData: BoxCreationData;
}

export interface UsePalletSaveResult {
  onSavingChanges: () => Promise<void>;
}

const normalizePalletTareWeight = (value: unknown): number | null => {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : NaN;
};

export function usePalletSave({
  temporalPallet,
  setPallet,
  setSaving,
  onChange,
  skipBackendSave,
  session,
  boxCreationData,
}: UsePalletSaveParams): UsePalletSaveResult {
  const onSavingChanges = async () => {
    if (!temporalPallet) return;

    saveDiscountPreferences(boxCreationData);

    if (skipBackendSave) {
      onChange(temporalPallet);
      return;
    }

    setSaving(true);

    const canCost = canManagePalletCostFields(
      session?.user as Parameters<typeof canManagePalletCostFields>[0]
    );
    const palletPayload = canCost
      ? temporalPallet
      : (stripPalletCostFieldsFromPayload(temporalPallet) as PalletState);
    const palletTareWeightKg = normalizePalletTareWeight(palletPayload.palletTareWeightKg);
    if (
      Number.isNaN(palletTareWeightKg) ||
      (palletTareWeightKg !== null && palletTareWeightKg < 0)
    ) {
      notify.error({
        title: 'Tara del palet no válida',
        description: 'La tara del palet debe ser un número mayor o igual que 0.',
      });
      setSaving(false);
      return;
    }
    const normalizedPalletPayload = {
      ...palletPayload,
      palletTareWeightKg,
    };

    if (temporalPallet.id === null) {
      (createPallet as (payload: unknown) => Promise<unknown>)(normalizedPalletPayload)
        .then((data: unknown) => {
          setPallet(data as PalletState);
          onChange(data as PalletState);
          notify.success({
            title: 'Palet creado',
            description: 'El palet se ha guardado correctamente.',
          });
        })
        .catch((err: Record<string, unknown>) => {
          const errorMessage =
            (err.userMessage as string) ||
            ((err.data as Record<string, unknown>)?.userMessage as string) ||
            (((err.response as Record<string, unknown>)?.data as Record<string, unknown>)
              ?.userMessage as string) ||
            (err.message as string) ||
            'Error al crear el palet';
          notify.error({ title: 'Error al crear el palet', description: errorMessage });
        })
        .finally(() => {
          setSaving(false);
        });
    } else {
      (updatePallet as (id: unknown, payload: unknown) => Promise<unknown>)(
        temporalPallet.id,
        normalizedPalletPayload
      )
        .then((data: unknown) => {
          setPallet(data as PalletState);
          onChange(data as PalletState);
          notify.success({
            title: 'Palet actualizado',
            description: 'Los cambios del palet se han guardado correctamente.',
          });
        })
        .catch((err: Record<string, unknown>) => {
          const errorMessage =
            (err.userMessage as string) ||
            ((err.data as Record<string, unknown>)?.userMessage as string) ||
            (((err.response as Record<string, unknown>)?.data as Record<string, unknown>)
              ?.userMessage as string) ||
            (err.message as string) ||
            'Error al actualizar el palet';
          notify.error({ title: 'Error al actualizar el palet', description: errorMessage });
        })
        .finally(() => {
          setSaving(false);
        });
    }
  };

  return { onSavingChanges };
}
