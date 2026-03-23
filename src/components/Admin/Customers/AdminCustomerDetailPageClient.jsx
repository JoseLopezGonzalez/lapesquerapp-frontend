'use client';

import EditEntityForm from '@/components/Admin/Entity/EntityClient/EntityForms/EditEntityForm';
import { configs } from '@/configs/entitiesConfig';

export default function AdminCustomerDetailPageClient({ customerId }) {
  return (
    <div className="p-4 sm:p-6">
      <EditEntityForm config={configs.customers} id={customerId} />
    </div>
  );
}
