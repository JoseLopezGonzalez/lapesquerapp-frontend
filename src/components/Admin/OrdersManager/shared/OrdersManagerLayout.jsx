'use client';

import { Skeleton } from '@/components/ui/skeleton';
import ProductionView from '@/components/Admin/OrdersManager/ProductionView';

export default function OrdersManagerLayout({
  loading,
  viewMode,
  isMobile,
  hasDetail,
  listContent,
  detailContent,
  onClickProductionOrder,
  onToggleViewMode,
}) {
  if (loading) {
    return (
      <div className="flex h-full w-full flex-col gap-3 p-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-8 w-24" />
        </div>
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {viewMode === 'production' ? (
        <div className="flex h-full flex-col overflow-hidden">
          <div className="h-full min-h-0 overflow-hidden">
            <ProductionView
              onClickOrder={onClickProductionOrder}
              onToggleViewMode={onToggleViewMode}
            />
          </div>
        </div>
      ) : isMobile ? (
        <div className="flex h-full min-h-0 flex-col">
          {hasDetail ? (
            <div className="h-full overflow-hidden">{detailContent}</div>
          ) : (
            <div className="flex h-full min-h-0 flex-col overflow-hidden">{listContent}</div>
          )}
        </div>
      ) : (
        <div className="flex h-full flex-col xl:flex-row">
          <div className="w-full xl:h-full xl:w-[360px] xl:flex-shrink-0">{listContent}</div>
          <div className="grow p-2 lg:pl-0">{detailContent}</div>
        </div>
      )}
    </div>
  );
}
