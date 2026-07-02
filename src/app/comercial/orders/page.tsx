import EntityClient from '@/components/Admin/Entity/EntityClient';
import { configs } from '@/configs/entitiesConfig';

export default function ComercialOrdersCrudPage() {
  const comercialOrdersConfig = {
    ...configs.orders,
    title: 'Pedidos',
    description: 'Listado y consulta de pedidos (solo lectura).',
    viewRoute: '/comercial/orders/:id',
    sameTabNavigation: true,
    hideCreateButton: true,
    hideEditButton: true,
    // Exports (comercial): only generic Excel + order sheets PDF.
    exports: (configs.orders?.exports ?? []).filter((opt: { title?: string }) =>
      ['Exportar a Excel', 'Imprimir Hojas de Pedidos'].includes(opt?.title ?? '')
    ),
    isSelectable: false,
    hideBulkDelete: true,
  };

  return <EntityClient config={comercialOrdersConfig} />;
}
