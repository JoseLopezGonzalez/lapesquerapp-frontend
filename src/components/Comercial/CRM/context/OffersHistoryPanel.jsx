'use client';

import Link from 'next/link';
import { EmptyState } from '@/components/Utilities/EmptyState';
import Loader from '@/components/Utilities/Loader';
import StatusPill from '../StatusPill';
import { formatDateValue, offerStatusLabels } from '../utils';

export default function OffersHistoryPanel({
  offers = [],
  isLoading = false,
  emptyTitle = 'Sin histórico comercial relevante',
  emptyDescription = 'No hay ofertas vinculadas para este target.',
  linkBasePath = '/comercial/ofertas',
}) {
  if (isLoading) {
    return (
      <div className="flex min-h-[220px] items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (!offers.length) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        className="h-full w-full border bg-muted/20 !min-h-[220px]"
      />
    );
  }

  return (
    <div className="space-y-3">
      {offers.map((offer) => (
        <Link
          key={offer.id}
          href={`${linkBasePath}/${offer.id}`}
          className="block rounded-xl border p-4 hover:bg-accent/40"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-medium">Oferta #{offer.id}</p>
              <p className="text-sm text-muted-foreground">
                {offer.validUntil ? `Validez: ${formatDateValue(offer.validUntil)}` : 'Sin validez definida'}
              </p>
            </div>
            <StatusPill label={offerStatusLabels[offer.status] ?? offer.status} status={offer.status} />
          </div>
        </Link>
      ))}
    </div>
  );
}
