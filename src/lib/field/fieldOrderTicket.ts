type PlannedProductDetail = {
  product?: { id?: number | string | null; name?: string | null } | null;
  boxes?: number | string | null;
  quantity?: number | string | null;
  unitPrice?: number | string | null;
};

type TicketItem = {
  productId: number;
  productName: string;
  boxesCount: number;
  totalWeight: number;
  unitPrice: number;
  subtotal: number;
};

type OrderWithPlannedProductDetails = {
  plannedProductDetails?: PlannedProductDetail[] | null;
};

export function mapPlannedProductDetailsToTicketItems(order: OrderWithPlannedProductDetails | null | undefined): TicketItem[] {
  const details = order?.plannedProductDetails ?? [];
  if (!Array.isArray(details)) return [];

  return details
    .map((detail) => {
      const productId = Number(detail?.product?.id);
      if (!Number.isFinite(productId)) return null;
      const totalWeight = Number(detail?.quantity) || 0;
      const unitPrice = Number(detail?.unitPrice) || 0;
      return {
        productId,
        productName: String(detail?.product?.name ?? ''),
        boxesCount: Number(detail?.boxes) || 0,
        totalWeight,
        unitPrice,
        subtotal: totalWeight * unitPrice,
      };
    })
    .filter(Boolean);
}

