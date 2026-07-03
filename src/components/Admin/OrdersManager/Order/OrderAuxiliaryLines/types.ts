export const NO_CATALOG_VALUE = '__none__';

export interface AuxiliaryLineRow {
  id?: number | string;
  tempId?: number;
  isTemporary?: boolean;
  auxiliaryProduct: { id: number | string; name: string } | null;
  description: string;
  quantity: number | string;
  unit: string;
  unitPrice: number | string;
  tax: { id: number | string | null; rate: number | null };
}

export function isRowValid(row: AuxiliaryLineRow): boolean {
  const hasArticle = row.auxiliaryProduct != null || row.description.trim() !== '';
  const quantity = row.quantity === '' ? NaN : Number(row.quantity);
  const unitPrice = row.unitPrice === '' ? NaN : Number(row.unitPrice);
  return (
    hasArticle &&
    Number.isFinite(quantity) &&
    quantity > 0 &&
    Number.isFinite(unitPrice) &&
    unitPrice >= 0
  );
}
