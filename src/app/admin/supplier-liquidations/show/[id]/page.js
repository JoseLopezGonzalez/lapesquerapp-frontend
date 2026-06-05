import { SupplierLiquidationShowDetail } from '@/components/Admin/SupplierLiquidations/SupplierLiquidationShowDetail';

export default async function SupplierLiquidationShowPage({ params }) {
  const { id } = await params;
  return <SupplierLiquidationShowDetail liquidationId={Number(id)} />;
}
