import EntityClient from '@/components/Admin/Entity/EntityClient';
import { configs } from '@/configs/entitiesConfig';

export default function AdminOrdersCrudPage() {
  const adminOrdersConfig = {
    ...configs.orders,
    actions: [
      {
        title: 'Marcar como facturado',
        endpoint: 'orders/update-invoiced',
        method: 'POST',
        confirmation: '¿Deseas marcar los pedidos seleccionados como facturados?',
        successMessage: 'Pedidos marcados como facturados correctamente.',
        errorMessage: 'Hubo un error al actualizar los pedidos.',
        body: { invoiced: true },
      },
      {
        title: 'Marcar como no facturado',
        endpoint: 'orders/update-invoiced',
        method: 'POST',
        confirmation: '¿Deseas desmarcar como facturados los pedidos seleccionados?',
        successMessage: 'Pedidos marcados como no facturados correctamente.',
        errorMessage: 'Hubo un error al actualizar los pedidos.',
        body: { invoiced: false },
      },
    ],
  };

  return <EntityClient config={adminOrdersConfig} />;
}
