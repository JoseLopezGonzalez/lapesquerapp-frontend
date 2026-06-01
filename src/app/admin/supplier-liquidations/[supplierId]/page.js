import { SupplierLiquidationDetail } from '@/components/Admin/SupplierLiquidations/SupplierLiquidationDetail';

export default async function SupplierLiquidationDetailPage({ params }) {
  const { supplierId } = await params;
  const parsedId = parseInt(supplierId, 10);

  if (isNaN(parsedId)) {
    return (
      <div className="container mx-auto p-6">
        <div className="py-12 text-center">
          <p className="text-destructive mb-2 text-lg font-medium">ID de proveedor inválido</p>
        </div>
      </div>
    );
  }

  return <SupplierLiquidationDetail supplierId={parsedId} />;
}
