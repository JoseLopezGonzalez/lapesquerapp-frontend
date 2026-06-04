type PalletQrSource = {
  id?: string | number | null;
  orderId?: string | number | null;
  order?: {
    id?: string | number | null;
  } | null;
};

export function buildPalletQrPayload(pallet: PalletQrSource | null | undefined): string {
  const palletId = pallet?.id;
  if (palletId === null || palletId === undefined || palletId === '') return '';

  const parts = [`P=${palletId}`];
  const orderId = pallet?.orderId ?? pallet?.order?.id;
  if (orderId !== null && orderId !== undefined && orderId !== '') {
    parts.push(`O=${orderId}`);
  }

  return parts.join(';');
}
