import ProductionClient from "./ProductionClient";

export default async function ProductionPage({ params }) {
    const id = params.id;

    return (
        <ProductionClient productionId={id} />
    );
}

