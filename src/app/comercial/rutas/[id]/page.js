import RoutesPlannerPage from '@/components/Comercial/Routes/RoutesPlannerPage';

export default async function ComercialRouteDetailPage({ params }) {
  const { id } = await params;

  return (
    <div className="flex h-full min-h-0 w-full flex-col p-4 sm:p-6">
      <RoutesPlannerPage initialTab="routes" routeId={id} />
    </div>
  );
}
