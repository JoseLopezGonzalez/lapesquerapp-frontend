
import PalletClient from "./PalletClient";

export default async function PalletPage({ params }) {
    const { id } = await params;

    return (
        <PalletClient palletId={id} />
    );
}
