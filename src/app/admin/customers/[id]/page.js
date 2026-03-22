import AdminCustomerDetailPageClient from '@/components/Admin/Customers/AdminCustomerDetailPageClient';

export default async function AdminCustomerDetailPage({ params }) {
  const { id } = await params;
  return <AdminCustomerDetailPageClient customerId={id} />;
}
