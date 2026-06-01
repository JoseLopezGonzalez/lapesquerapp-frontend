'use client';

import { useCallback } from 'react';
import {
  deletePallet,
  linkPalletToOrder,
  linkPalletsToOrders,
  unlinkPalletFromOrder,
  unlinkPalletsFromOrders,
} from '@/services/palletService';
import { notify } from '@/lib/notifications';
import type { Order } from '@/services/orderService';

function extractErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === 'object') {
    const e = error as Record<string, unknown>;
    const data = e.data as Record<string, unknown> | undefined;
    const response = e.response as Record<string, unknown> | undefined;
    const responseData = response?.data as Record<string, unknown> | undefined;
    return (
      (e.userMessage as string | undefined) ||
      (data?.userMessage as string | undefined) ||
      (responseData?.userMessage as string | undefined) ||
      (e.message as string | undefined) ||
      fallback
    );
  }
  return fallback;
}

interface UseOrderPalletsParams {
  order: Order | null;
  accessToken: string | null | undefined;
  onOrderUpdate: (updatedOrder: Order) => void;
  reload: () => Promise<Order | null>;
  onChange?: (order: Order) => void;
}

export interface UseOrderPalletsResult {
  onEditingPallet: (updatedPallet: Record<string, unknown>) => Promise<void>;
  onCreatingPallet: (newPallet: Record<string, unknown>) => Promise<void>;
  onDeletePallet: (palletId: number | string) => Promise<void>;
  onUnlinkPallet: (palletId: number | string) => Promise<void>;
  onLinkPallets: (palletIds: (number | string)[]) => Promise<void>;
  onUnlinkAllPallets: (palletIds: (number | string)[]) => Promise<void>;
}

export function useOrderPallets({
  order,
  accessToken,
  onOrderUpdate,
  reload,
  onChange,
}: UseOrderPalletsParams): UseOrderPalletsResult {
  const onEditingPallet = useCallback(
    async (updatedPallet: Record<string, unknown>) => {
      if (!order) return;
      if (updatedPallet.orderId !== order.id) {
        notify.error({ title: 'El pallet no está vinculado a este pedido' });
        return;
      }
      const pallets = order.pallets as Array<Record<string, unknown>>;
      onOrderUpdate({
        ...order,
        pallets: pallets.map((p) => (p.id == updatedPallet.id ? updatedPallet : p)),
      } as Order);

      try {
        const reloadedOrder = await reload();
        if (reloadedOrder) onChange?.(reloadedOrder);
      } catch (error) {
        notify.error({ title: extractErrorMessage(error, 'Error al recargar el pedido') });
      }
    },
    [order, onOrderUpdate, reload, onChange]
  );

  const onCreatingPallet = useCallback(
    async (newPallet: Record<string, unknown>) => {
      if (!order) return;
      if (newPallet.orderId !== order.id) {
        notify.error({ title: 'El pallet no está vinculado a este pedido' });
        return;
      }
      onOrderUpdate({
        ...order,
        pallets: [...(order.pallets as unknown[]), newPallet],
      } as Order);

      try {
        const reloadedOrder = await reload();
        if (reloadedOrder) {
          onChange?.(reloadedOrder);
          notify.success({ title: 'Palet creado y vinculado correctamente' });
        }
      } catch (error) {
        notify.error({ title: extractErrorMessage(error, 'Error al recargar el pedido') });
      }
    },
    [order, onOrderUpdate, reload, onChange]
  );

  const onDeletePallet = useCallback(
    async (palletId: number | string) => {
      try {
        await deletePallet(palletId, accessToken ?? '');
        if (!order) return;
        const pallets = order.pallets as Array<{ id: number | string }>;
        onOrderUpdate({ ...order, pallets: pallets.filter((p) => p.id !== palletId) } as Order);

        const reloadedOrder = await reload();
        if (reloadedOrder) onChange?.(reloadedOrder);

        notify.success({ title: 'Palet eliminado correctamente' });
      } catch (error) {
        notify.error({ title: extractErrorMessage(error, 'Error al eliminar el palet') });
        throw error;
      }
    },
    [order, accessToken, onOrderUpdate, reload, onChange]
  );

  const onUnlinkPallet = useCallback(
    async (palletId: number | string) => {
      try {
        await unlinkPalletFromOrder(palletId, accessToken ?? '');
        if (!order) return;
        const pallets = order.pallets as Array<{ id: number | string }>;
        onOrderUpdate({ ...order, pallets: pallets.filter((p) => p.id !== palletId) } as Order);

        const reloadedOrder = await reload();
        if (reloadedOrder) onChange?.(reloadedOrder);

        notify.success({ title: 'Palet desvinculado correctamente' });
      } catch (error) {
        notify.error({ title: extractErrorMessage(error, 'Error al desvincular el palet') });
        throw error;
      }
    },
    [order, accessToken, onOrderUpdate, reload, onChange]
  );

  const onLinkPallets = useCallback(
    async (palletIds: (number | string)[]) => {
      if (!order?.id) {
        notify.error({ title: 'No se puede vincular palets: el pedido no tiene ID' });
        return;
      }

      try {
        let result: unknown;
        if (palletIds.length === 1) {
          result = await linkPalletToOrder(palletIds[0], order.id, accessToken ?? '');
        } else {
          result = await linkPalletsToOrders(
            palletIds.map((id) => ({ id, orderId: order.id })),
            accessToken ?? ''
          );
        }

        const updatedOrder = await reload();
        onChange?.(updatedOrder as Order);

        const r = result as Record<string, unknown>;
        if (palletIds.length === 1) {
          notify.success({ title: (r.message as string) || 'Palet vinculado correctamente' });
        } else {
          const linked = r.linked as number;
          const alreadyLinked = r.already_linked as number;
          const errors = r.errors as number;

          if (linked > 0) {
            notify.success({
              title:
                linked === 1
                  ? 'Palet vinculado correctamente'
                  : `${linked} palets vinculados correctamente`,
            });
          }
          if (alreadyLinked > 0) {
            notify.info({
              title:
                alreadyLinked === 1
                  ? '1 palet ya estaba vinculado'
                  : `${alreadyLinked} palets ya estaban vinculados`,
            });
          }
          if (errors > 0) {
            const errorDetails = (r.error_details || r.errors_details || []) as Array<
              Record<string, unknown>
            >;
            errorDetails.forEach((e) => {
              notify.error({
                title: `Palet ${e.pallet_id}: ${extractErrorMessage(e, 'Error desconocido')}`,
              });
            });
          }
        }
      } catch (error) {
        notify.error({ title: extractErrorMessage(error, 'Error al vincular los palets') });
        throw error;
      }
    },
    [order, accessToken, reload, onChange]
  );

  const onUnlinkAllPallets = useCallback(
    async (palletIds: (number | string)[]) => {
      if (!palletIds || palletIds.length === 0) {
        notify.error({ title: 'No hay palets para desvincular' });
        return;
      }

      try {
        const result = await unlinkPalletsFromOrders(palletIds, accessToken ?? '');
        const r = result as Record<string, unknown>;

        const unlinked = r.unlinked as number;
        const alreadyUnlinked = r.already_unlinked as number;
        const errors = r.errors as number;

        if (unlinked > 0) {
          notify.success({
            title:
              unlinked === 1
                ? 'Palet desvinculado correctamente'
                : `${unlinked} palets desvinculados correctamente`,
          });
        }
        if (alreadyUnlinked > 0) {
          notify.info({
            title:
              alreadyUnlinked === 1
                ? '1 palet ya estaba desvinculado'
                : `${alreadyUnlinked} palets ya estaban desvinculados`,
          });
        }
        if (errors > 0) {
          const errorDetails =
            (r.results as Array<Record<string, unknown>>)?.filter(
              (item) => item.status !== 'unlinked'
            ) || [];
          errorDetails.forEach((e) => {
            notify.error({
              title: `Palet ${e.pallet_id}: ${extractErrorMessage(e, 'Error al desvincular')}`,
            });
          });
        }

        if (!order) return;
        const pallets = order.pallets as Array<{ id: number | string }>;
        onOrderUpdate({
          ...order,
          pallets: pallets.filter((p) => !palletIds.includes(p.id)),
        } as Order);

        const reloadedOrder = await reload();
        if (reloadedOrder) onChange?.(reloadedOrder);
      } catch (error) {
        notify.error({ title: extractErrorMessage(error, 'Error al desvincular los palets') });
        throw error;
      }
    },
    [order, accessToken, onOrderUpdate, reload, onChange]
  );

  return {
    onEditingPallet,
    onCreatingPallet,
    onDeletePallet,
    onUnlinkPallet,
    onLinkPallets,
    onUnlinkAllPallets,
  };
}
