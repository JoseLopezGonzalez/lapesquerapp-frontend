import dynamic from 'next/dynamic';
import Loader from '@/components/Utilities/Loader';

const ProspectDetail = dynamic(() => import('@/components/Comercial/CRM/ProspectDetail'), {
  loading: () => (
    <div className="flex min-h-[360px] items-center justify-center">
      <Loader />
    </div>
  ),
});

export default async function ComercialProspectDetailPage({ params }) {
  const { id } = await params;

  return (
    <div className="h-full w-full px-4 py-3 md:px-6">
      <ProspectDetail prospectId={id} />
    </div>
  );
}
