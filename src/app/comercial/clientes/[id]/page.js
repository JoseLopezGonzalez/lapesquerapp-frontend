import { StandaloneCustomerDetail } from '@/components/Comercial/CRM/CustomersPageClient';

export default async function ComercialCustomerDetailPage({ params }) {
  const { id } = await params;

  return (
    <div className="h-full w-full px-4 py-3 md:px-6">
      <StandaloneCustomerDetail customerId={id} />
    </div>
  );
}
