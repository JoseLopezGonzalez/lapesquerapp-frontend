import FieldRouteExecutionPage from '@/components/Field/FieldRouteExecutionPage';

export default async function FieldRouteDetailPage({ params }) {
  const { id } = await params;

  return (
    <div className="flex h-full min-h-0 w-full min-w-0 flex-col">
      <FieldRouteExecutionPage routeId={id} />
    </div>
  );
}
