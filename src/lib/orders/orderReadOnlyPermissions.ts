export const COMMERCIAL_IN_PROGRESS_BLOCKED_ORDER_SECTIONS = [
  'labels',
  'documents',
  'incident',
  'export',
];

type OrderPermissionState = {
  readOnly?: boolean;
  status?: string | null;
};

export function isReadOnlyOrderInProgress({ readOnly = false, status }: OrderPermissionState) {
  return Boolean(readOnly && status && status !== 'finished');
}

export function getBlockedOrderSectionsForReadOnly(state: OrderPermissionState): string[] {
  return isReadOnlyOrderInProgress(state) ? COMMERCIAL_IN_PROGRESS_BLOCKED_ORDER_SECTIONS : [];
}

export function isOrderPalletsReadOnly(state: OrderPermissionState) {
  return isReadOnlyOrderInProgress(state);
}
