'use client';

import EditEntityForm from '@/components/Admin/Entity/EntityClient/EntityForms/EditEntityForm';
import CustomerAssignmentPanel from './CustomerAssignmentPanel';
import { configs } from '@/configs/entitiesConfig';

export default function AdminCustomerDetailPageClient({ customerId }) {
  return (
    <div className="grid gap-4 p-4 sm:p-6 xl:grid-cols-[minmax(0,1.2fr)_420px]">
      <EditEntityForm config={configs.customers} id={customerId} />
      <CustomerAssignmentPanel customerId={customerId} />
    </div>
  );
}
