'use client';

import FieldOrderExecutionPage from '@/components/Field/FieldOrderExecutionPage';

export default function FieldOrderDetailPage({ params }) {
  return (
    <div className="flex h-full min-h-0 w-full flex-col p-4 sm:p-6">
      <FieldOrderExecutionPage orderId={params.id} />
    </div>
  );
}
