'use client';

import FieldRouteExecutionPage from '@/components/Field/FieldRouteExecutionPage';

export default function FieldRouteDetailPage({ params }) {
  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      <FieldRouteExecutionPage routeId={params.id} />
    </div>
  );
}
