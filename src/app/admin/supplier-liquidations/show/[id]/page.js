import { SupplierLiquidationShowDetail } from '@/components/Admin/SupplierLiquidations/SupplierLiquidationShowDetail';

export default function SupplierLiquidationShowPage({ params }) {
  const liquidationId = Number(params.id);
  return <SupplierLiquidationShowDetail liquidationId={liquidationId} />;
}
