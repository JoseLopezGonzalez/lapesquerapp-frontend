export interface PlannedDetailProduct {
  id: number | string | null;
  name: string;
}

export interface PlannedDetailTax {
  id?: number | string | null;
  rate: number | string | null;
}

export interface PlannedDetail {
  id?: number | string;
  tempId?: number;
  isTemporary?: boolean;
  orderId?: number | string;
  product: PlannedDetailProduct;
  boxes: number | string;
  quantity: number | string;
  unitPrice: number | string;
  tax: PlannedDetailTax;
  [key: string]: unknown;
}

export function isDetailValid(detail: PlannedDetail): boolean {
  const hasProduct = detail.product?.id != null && detail.product.id !== '';
  const quantity = detail.quantity === '' ? NaN : Number(detail.quantity);
  const unitPrice = detail.unitPrice === '' ? NaN : Number(detail.unitPrice);
  return (
    hasProduct &&
    Number.isFinite(quantity) &&
    quantity > 0 &&
    Number.isFinite(unitPrice) &&
    unitPrice >= 0
  );
}
