import ProductionRecordClient from "./ProductionRecordClient";

export default async function ProductionRecordPage({ params }) {
    const { id, recordId } = await params;
    const productionId = id;

    return (
        <ProductionRecordClient 
            productionId={productionId}
            recordId={recordId} 
        />
    );
}

