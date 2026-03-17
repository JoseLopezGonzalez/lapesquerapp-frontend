import OfferDetail from '@/components/Comercial/CRM/OfferDetail';

export default function ComercialOfferDetailPage({ params }) {
  return (
    <div className="h-full w-full px-4 py-3 md:px-6">
      <OfferDetail offerId={params.id} />
    </div>
  );
}
