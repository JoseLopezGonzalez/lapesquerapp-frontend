type FieldOrderDetailItem = {
  id?: number | string | null;
  product?: {
    id?: number | string | null;
    name?: string | null;
  } | null;
  productId?: number | string | null;
  productName?: string | null;
  boxes?: number | string | null;
  quantity?: number | string | null;
  unitPrice?: number | string | null;
  tax?: {
    id?: number | string | null;
  } | null;
  taxId?: number | string | null;
};

type FieldOrderDetail = {
  plannedProductDetails?: FieldOrderDetailItem[];
};

type BoxItem = {
  id?: number | string | null;
  productId?: number | string | null;
  productName?: string | null;
  netWeight?: number | string | null;
  lot?: string | null;
  gs1128?: string | null;
  grossWeight?: number | string | null;
};

type ServedItem = {
  plannedProductDetailId?: number;
  productId: number;
  productName: string;
  boxesCount: number;
  totalWeight: number;
  unitPrice: number;
  subtotal: number;
  taxId?: number;
};

function getDetailProductId(detail: FieldOrderDetailItem) {
  return Number(detail?.product?.id ?? detail?.productId);
}

function getDetailProductName(detail: FieldOrderDetailItem) {
  return detail?.product?.name ?? detail?.productName ?? '';
}

function getDetailTaxId(detail: FieldOrderDetailItem) {
  const raw = detail?.tax?.id ?? detail?.taxId;
  return raw != null ? Number(raw) : undefined;
}

export function buildInitialItems(order: FieldOrderDetail | null | undefined): ServedItem[] {
  return (order?.plannedProductDetails ?? []).map((detail) => ({
    plannedProductDetailId: detail?.id != null ? Number(detail.id) : undefined,
    productId: getDetailProductId(detail),
    productName: getDetailProductName(detail),
    boxesCount: Number(detail?.boxes) || 0,
    totalWeight: Number(detail?.quantity) || 0,
    unitPrice: Number(detail?.unitPrice) || 0,
    subtotal: (Number(detail?.quantity) || 0) * (Number(detail?.unitPrice) || 0),
    taxId: getDetailTaxId(detail),
  }));
}

export function aggregateItemsFromBoxes(boxes: BoxItem[] = [], order: FieldOrderDetail | null | undefined) {
  const byProduct = new Map<number, ServedItem>();
  const existingByProductId = new Map((order?.plannedProductDetails ?? []).map((detail) => [getDetailProductId(detail), detail]));

  for (const box of boxes) {
    const id = Number(box.productId);
    if (!byProduct.has(id)) {
      const detail = existingByProductId.get(id);
      byProduct.set(id, {
        plannedProductDetailId: detail?.id != null ? Number(detail.id) : undefined,
        productId: id,
        productName: box.productName ?? (detail ? getDetailProductName(detail) : '') ?? '',
        boxesCount: 0,
        totalWeight: 0,
        unitPrice: Number(detail?.unitPrice) || 0,
        subtotal: 0,
        taxId: detail ? getDetailTaxId(detail) : undefined,
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

export function buildBoxesSyncPayload(boxes: BoxItem[] = []) {
  return boxes.map((box) => ({
    id: box.id != null ? Number(box.id) : undefined,
    productId: box.productId != null ? Number(box.productId) : undefined,
    lot: box.lot ? String(box.lot) : undefined,
    netWeight: Number(box.netWeight) || 0,
    grossWeight: box.grossWeight != null ? Number(box.grossWeight) : undefined,
    gs1128: box.gs1128 ? String(box.gs1128) : undefined,
  }));
}

export function detectExtraProductIds(boxes: BoxItem[] = [], order: FieldOrderDetail | null | undefined) {
  const planned = new Set((order?.plannedProductDetails ?? []).map((d) => getDetailProductId(d)));
  const present = new Set(boxes.map((b) => Number(b.productId)));
  return Array.from(present).filter((productId) => !planned.has(productId));
}

export function buildPlannedExtrasPayload(servedItems: ServedItem[] = [], extraProductIds: number[] = []) {
  const extraSet = new Set(extraProductIds.map(Number));
  return servedItems
    .filter((item) => extraSet.has(Number(item.productId)))
    .map((item) => ({
      productId: Number(item.productId),
      unitPrice: Number(item.unitPrice) || 0,
      taxId: item.taxId != null ? Number(item.taxId) : undefined,
    }));
}

export function buildPlannedAdjustmentsPayload(servedItems: ServedItem[] = [], order: FieldOrderDetail | null | undefined) {
  const plannedById = new Map<number, FieldOrderDetailItem>();
  (order?.plannedProductDetails ?? []).forEach((d) => {
    if (d?.id == null) return;
    plannedById.set(Number(d.id), d);
  });

  return servedItems
    .filter((item) => item.plannedProductDetailId != null)
    .map((item) => {
      const detailId = Number(item.plannedProductDetailId);
      const planned = plannedById.get(detailId);
      if (!planned) return null;
      const plannedUnitPrice = Number(planned.unitPrice) || 0;
      const plannedTaxId = getDetailTaxId(planned);
      const changedPrice = (Number(item.unitPrice) || 0) !== plannedUnitPrice;
      const changedTax = (item.taxId ?? null) !== (plannedTaxId ?? null);
      if (!changedPrice && !changedTax) return null;
      return {
        plannedProductDetailId: detailId,
        unitPrice: Number(item.unitPrice) || 0,
        taxId: item.taxId != null ? Number(item.taxId) : undefined,
      };
    })
    .filter(Boolean);
}
