import OfferDetail from '@/components/Comercial/CRM/OfferDetail';

export default async function ComercialOfferDetailPage({ params }) {
  const { id } = await params;

  return (
    <div className="h-full w-full px-4 py-3 md:px-6">
      <OfferDetail offerId={id} />
    </div>
  );
}
