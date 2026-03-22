import FieldOrderExecutionPage from '@/components/Field/FieldOrderExecutionPage';

export default async function FieldOrderDetailPage({ params }) {
  const { id } = await params;

  return (
    <div className="flex h-full min-h-0 w-full flex-col p-4 sm:p-6">
      <FieldOrderExecutionPage orderId={id} />
    </div>
  );
}
