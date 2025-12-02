import CreateProductionRecordPage from './CreateProductionRecordPage'

export default async function CreateProductionRecordPageWrapper({ params }) {
    const { id } = await params;
    const productionId = id;

    return (
        <CreateProductionRecordPage productionId={productionId} />
    )
}

