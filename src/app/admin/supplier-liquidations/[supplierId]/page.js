import { SupplierLiquidationDetail } from "@/components/Admin/SupplierLiquidations/SupplierLiquidationDetail"

export default async function SupplierLiquidationDetailPage({ params }) {
    const { supplierId } = await params
    const parsedId = parseInt(supplierId, 10)
    
    if (isNaN(parsedId)) {
        return (
            <div className="container mx-auto p-6">
                <div className="text-center py-12">
                    <p className="text-lg font-medium text-destructive mb-2">
                        ID de proveedor inválido
                    </p>
                </div>
            </div>
        )
    }
    
    return <SupplierLiquidationDetail supplierId={parsedId} />
}

