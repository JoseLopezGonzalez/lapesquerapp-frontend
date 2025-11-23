import CreateProductionRecordPage from './CreateProductionRecordPage'

export default async function CreateProductionRecordPageWrapper({ params }) {
    const productionId = params.id

    return (
        <CreateProductionRecordPage productionId={productionId} />
    )
}

