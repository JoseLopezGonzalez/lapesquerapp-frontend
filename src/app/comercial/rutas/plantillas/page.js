'use client';

import RoutesPlannerPage from '@/components/Comercial/Routes/RoutesPlannerPage';

export default function ComercialRouteTemplatesPage() {
  return (
    <div className="flex h-full min-h-0 w-full min-w-0 flex-col p-4 sm:p-6">
      <RoutesPlannerPage initialTab="templates" />
    </div>
  );
}
