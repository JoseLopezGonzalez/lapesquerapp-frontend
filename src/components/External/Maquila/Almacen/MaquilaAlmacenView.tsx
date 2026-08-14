'use client';

import { useState } from 'react';
import Masonry from 'react-masonry-css';
import { Warehouse } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/Utilities/EmptyState';
import { PaginationFooter } from '@/components/Admin/Entity/EntityClient/EntityTable/EntityFooter/PaginationFooter';
import { useMaquilaPalletList } from '@/hooks/pallets/useMaquilaPalletList';
import { MaquilaPalletCard } from './MaquilaPalletCard';
import { MaquilaPalletFilters } from './MaquilaPalletFilters';
import { MaquilaPalletDetailSheet } from './MaquilaPalletDetailSheet';
import type { MaquilaPalletFilters as Filters } from '@/types/pallet';

const MASONRY_BREAKPOINTS = { default: 3, 1536: 3, 1280: 2, 768: 2, 640: 1 };
const PER_PAGE = 12;

export function MaquilaAlmacenView() {
  const [filters, setFilters] = useState<Filters>({});
  const [page, setPage] = useState(1);
  const [selectedPalletId, setSelectedPalletId] = useState<number | null>(null);

  const { data, meta, isLoading, error } = useMaquilaPalletList({
    filters,
    page,
    perPage: PER_PAGE,
  });

  const handleFiltersChange = (next: Filters) => {
    setFilters(next);
    setPage(1);
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div className="flex-shrink-0 space-y-1">
        <h1 className="text-xl font-semibold">Almacén interactivo</h1>
        <p className="text-muted-foreground text-sm">Tus palets propios en La PesquerApp.</p>
      </div>

      <div className="flex-shrink-0">
        <MaquilaPalletFilters filters={filters} onChange={handleFiltersChange} />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {isLoading && (
          <Masonry
            breakpointCols={MASONRY_BREAKPOINTS}
            className="masonry-grid"
            columnClassName="masonry-grid_column"
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="mb-4">
                <Skeleton className="h-64 w-full rounded-2xl" />
              </div>
            ))}
          </Masonry>
        )}

        {error && !isLoading && (
          <EmptyState
            title="No se pudo cargar el almacén"
            description={error}
            icon={<Warehouse />}
          />
        )}

        {!isLoading && !error && data.length === 0 && (
          <EmptyState
            title="Sin palets"
            description="No hay palets que coincidan con estos filtros."
            icon={<Warehouse />}
          />
        )}

        {!isLoading && !error && data.length > 0 && (
          <Masonry
            breakpointCols={MASONRY_BREAKPOINTS}
            className="masonry-grid"
            columnClassName="masonry-grid_column"
          >
            {data.map((pallet) => (
              <div key={pallet.id} className="mb-4">
                <MaquilaPalletCard pallet={pallet} onClick={() => setSelectedPalletId(pallet.id)} />
              </div>
            ))}
          </Masonry>
        )}
      </div>

      {!isLoading && !error && meta.last_page > 1 && (
        <div className="flex flex-shrink-0 justify-center border-t pt-3">
          <PaginationFooter
            meta={{ totalPages: meta.last_page }}
            currentPage={page}
            onPageChange={setPage}
          />
        </div>
      )}

      <MaquilaPalletDetailSheet
        palletId={selectedPalletId}
        onOpenChange={(open) => !open && setSelectedPalletId(null)}
      />
    </div>
  );
}
