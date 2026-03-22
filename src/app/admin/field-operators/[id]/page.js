import FieldOperatorDetailPageClient from '@/components/Admin/FieldOperators/FieldOperatorDetailPageClient';

export default async function AdminFieldOperatorDetailPage({ params }) {
  const { id } = await params;
  return <FieldOperatorDetailPageClient id={id} />;
}
