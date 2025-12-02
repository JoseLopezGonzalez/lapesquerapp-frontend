
import Order from "@/components/Admin/OrdersManager/Order";
import OrderClient from "./OrderClient";

export default async function OrderPage({ params }) {
    const { id } = await params; // Obtiene el id de la URL

    return (
        <OrderClient orderId={id} />
    );
}
