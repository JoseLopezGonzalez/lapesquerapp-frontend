
import PalletClient from "./PalletClient";

export default async function PalletPage({ params }) {
    const id = params.id;

    return (
        <PalletClient palletId={id} />
    );
}
