'use client';

import Loader from '@/components/Utilities/Loader';
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
      <div className="w-full h-full flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {viewMode === 'production' ? (
        <div className="h-full flex flex-col overflow-hidden">
          <div className="h-full min-h-0 overflow-hidden">
            <ProductionView
              onClickOrder={onClickProductionOrder}
              onToggleViewMode={onToggleViewMode}
            />
          </div>
        </div>
      ) : isMobile ? (
        <div className="h-full flex flex-col min-h-0">
          {hasDetail ? (
            <div className="h-full overflow-hidden">{detailContent}</div>
          ) : (
            <div className="h-full flex flex-col overflow-hidden min-h-0">{listContent}</div>
          )}
        </div>
      ) : (
        <div className="flex flex-col xl:flex-row h-full">
          <div className="w-full xl:w-[360px] xl:flex-shrink-0 xl:h-full">{listContent}</div>
          <div className="grow lg:pl-0 p-2">{detailContent}</div>
        </div>
      )}
    </div>
  );
}
