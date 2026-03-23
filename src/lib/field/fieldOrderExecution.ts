type FieldOrderDetailItem = {
  product?: {
    id?: number | string | null;
    name?: string | null;
  } | null;
  boxes?: number | string | null;
  quantity?: number | string | null;
  unitPrice?: number | string | null;
  tax?: {
    id?: number | string | null;
  } | null;
};

type FieldOrderDetail = {
  plannedProductDetails?: FieldOrderDetailItem[];
};

type BoxItem = {
  productId?: number | string | null;
  productName?: string | null;
  netWeight?: number | string | null;
};

type ServedItem = {
  productId: number;
  productName: string;
  boxesCount: number;
  totalWeight: number;
  unitPrice: number;
  subtotal: number;
  tax?: number;
};

export function buildInitialItems(order: FieldOrderDetail | null | undefined): ServedItem[] {
  return (order?.plannedProductDetails ?? []).map((detail) => ({
    productId: Number(detail?.product?.id),
    productName: detail?.product?.name ?? '',
    boxesCount: Number(detail?.boxes) || 0,
    totalWeight: Number(detail?.quantity) || 0,
    unitPrice: Number(detail?.unitPrice) || 0,
    subtotal: (Number(detail?.quantity) || 0) * (Number(detail?.unitPrice) || 0),
    tax: detail?.tax?.id != null ? Number(detail.tax.id) : undefined,
  }));
}

export function aggregateItemsFromBoxes(boxes: BoxItem[] = [], order: FieldOrderDetail | null | undefined) {
  const byProduct = new Map<number, ServedItem>();
  const existingByProductId = new Map(
    (order?.plannedProductDetails ?? []).map((detail) => [Number(detail?.product?.id), detail])
  );

  for (const box of boxes) {
    const id = Number(box.productId);
    if (!byProduct.has(id)) {
      const detail = existingByProductId.get(id);
      byProduct.set(id, {
        productId: id,
        productName: box.productName ?? detail?.product?.name ?? '',
        boxesCount: 0,
        totalWeight: 0,
        unitPrice: Number(detail?.unitPrice) || 0,
        subtotal: 0,
        tax: detail?.tax?.id != null ? Number(detail.tax.id) : undefined,
      });
    }

    const row = byProduct.get(id);
    if (!row) continue;
    row.boxesCount += 1;
    row.totalWeight += Number(box.netWeight) || 0;
  }

  return Array.from(byProduct.values()).map((item) => ({
    ...item,
    subtotal: Number(item.totalWeight || 0) * Number(item.unitPrice || 0),
  }));
}

export function calculateServedItemsTotal(servedItems: ServedItem[] = []) {
  return servedItems.reduce((sum, item) => sum + (Number(item.subtotal) || 0), 0);
}

export function validateServedItems(servedItems: ServedItem[] = []) {
  if (servedItems.length === 0) {
    return 'El pedido debe tener al menos un producto.';
  }

  const invalidWeightItem = servedItems.find((item) => Number(item.totalWeight) <= 0);
  if (invalidWeightItem) {
    return `La cantidad de ${invalidWeightItem.productName ?? 'un producto'} debe ser mayor que 0.`;
  }

  if (servedItems.find((item) => Number(item.boxesCount) < 0)) {
    return 'El número de cajas no puede ser negativo.';
  }

  if (servedItems.find((item) => Number(item.unitPrice) < 0)) {
    return 'El precio no puede ser negativo.';
  }

  return null;
}

export function buildPlannedProductsPayload(servedItems: ServedItem[] = []) {
  return servedItems.map((item) => ({
    product: Number(item.productId),
    quantity: Number(item.totalWeight) || 0,
    boxes: Number(item.boxesCount) || 0,
    unitPrice: Number(item.unitPrice) || 0,
    tax: item.tax != null ? Number(item.tax) : undefined,
  }));
}
