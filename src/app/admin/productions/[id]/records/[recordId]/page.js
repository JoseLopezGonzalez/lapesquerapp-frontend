import ProductionRecordClient from "./ProductionRecordClient";

export default async function ProductionRecordPage({ params }) {
    const productionId = params.id;
    const recordId = params.recordId;

    return (
        <ProductionRecordClient 
            productionId={productionId}
            recordId={recordId} 
        />
    );
}

