import ProspectDetail from '@/components/Comercial/CRM/ProspectDetail';

export default function ComercialProspectDetailPage({ params }) {
  return (
    <div className="h-full w-full px-4 py-3 md:px-6">
      <ProspectDetail prospectId={params.id} />
    </div>
  );
}
