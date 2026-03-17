import { StandaloneCustomerDetail } from '@/components/Comercial/CRM/CustomersPageClient';

export default function ComercialCustomerDetailPage({ params }) {
  return (
    <div className="h-full w-full px-4 py-3 md:px-6">
      <StandaloneCustomerDetail customerId={params.id} />
    </div>
  );
}
