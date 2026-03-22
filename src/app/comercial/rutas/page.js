'use client';

import RoutesPlannerPage from '@/components/Comercial/Routes/RoutesPlannerPage';

export default function ComercialRoutesPage() {
  return (
    <div className="flex h-full min-h-0 w-full flex-col p-4 sm:p-6">
      <RoutesPlannerPage initialTab="routes" />
    </div>
  );
}
