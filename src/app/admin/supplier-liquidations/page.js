import EntityClient from '@/components/Admin/Entity/EntityClient';
import { configs } from '@/configs/entitiesConfig';

export default function SupplierLiquidationsPage() {
  const config = configs['supplier-liquidations'];
  return <EntityClient config={config} />;
}
