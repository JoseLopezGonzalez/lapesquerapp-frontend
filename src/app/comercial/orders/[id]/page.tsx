import ComercialOrderDetailClient from '@/components/Admin/OrdersManager/ComercialOrderDetailClient';

export default async function ComercialOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <ComercialOrderDetailClient orderId={id} />;
}
