import ProductionClient from "./ProductionClient";

export default async function ProductionPage({ params }) {
    const { id } = await params;

    return (
        <ProductionClient productionId={id} />
    );
}

