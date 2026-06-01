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
  token: string | undefined;
  session: { user?: unknown } | null;
  boxCreationData: BoxCreationData;
}

export interface UsePalletSaveResult {
  onSavingChanges: () => Promise<void>;
}

export function usePalletSave({
  temporalPallet,
  setPallet,
  setSaving,
  onChange,
  skipBackendSave,
  token,
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
    const safeToken = token ?? '';

    if (temporalPallet.id === null) {
      (createPallet as (payload: unknown, token: string) => Promise<unknown>)(
        palletPayload,
        safeToken
      )
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
      (updatePallet as (id: unknown, payload: unknown, token: string) => Promise<unknown>)(
        temporalPallet.id,
        palletPayload,
        safeToken
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
