
import Order from "@/components/Admin/OrdersManager/Order";
import OrderClient from "./OrderClient";

export default async function OrderPage({ params }) {
    /* const { id } = params; // Obtiene el id de la URL */
    const id = params.id;

    return (
        <OrderClient orderId={id} />
    );
}
