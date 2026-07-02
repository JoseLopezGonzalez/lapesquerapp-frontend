'use client';

import type { ReactNode } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import ProductionView from '@/components/Admin/OrdersManager/ProductionView';

interface OrdersManagerLayoutProps {
  loading?: boolean;
  viewMode?: string;
  isMobile?: boolean;
  hasDetail?: boolean;
  listContent: ReactNode;
  detailContent: ReactNode;
  onClickProductionOrder: (orderId: number | string) => void;
  onToggleViewMode?: () => void;
}

export default function OrdersManagerLayout({
  loading,
  viewMode,
  isMobile,
  hasDetail,
  listContent,
  detailContent,
  onClickProductionOrder,
  onToggleViewMode,
}: OrdersManagerLayoutProps) {
  if (loading) {
    return (
      <div className="flex h-full flex-col">
        {isMobile ? (
          <MobileOrdersListSkeleton />
        ) : (
          <div className="flex h-full flex-col xl:flex-row">
            <div className="w-full overflow-hidden xl:h-full xl:w-[360px] xl:flex-shrink-0">
              <DesktopOrdersListSkeleton />
            </div>
            <div className="grow p-2 lg:pl-0" />
          </div>
        )}
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

// Silueta de OrdersList mobile: header (back+título+crear) + búsqueda + tabs + tarjetas ≈104px
function MobileOrdersListSkeleton() {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="flex-shrink-0 px-0 pt-4 pb-3">
        <div className="flex items-center justify-between gap-2 px-2">
          <Skeleton className="h-12 w-12 rounded-full" />
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-12 w-12 rounded-full" />
        </div>
      </div>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-4">
        <div className="mb-3 flex-shrink-0 space-y-4 pt-1">
          <Skeleton className="h-9 w-full rounded-md" />
          <div className="flex gap-2 overflow-hidden">
            <Skeleton className="h-8 w-16 flex-shrink-0 rounded-md" />
            <Skeleton className="h-8 w-20 flex-shrink-0 rounded-md" />
            <Skeleton className="h-8 w-16 flex-shrink-0 rounded-md" />
            <Skeleton className="h-8 w-20 flex-shrink-0 rounded-md" />
          </div>
        </div>
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden pt-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <MobileOrderCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

// Silueta de OrderCard mobile: nombre + metadata + badge (3 alturas distintas) + chevron
function MobileOrderCardSkeleton() {
  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1 space-y-1.5">
          <Skeleton className="h-4 w-3/5" />
          <Skeleton className="h-3 w-2/5" />
          <Skeleton className="h-4 w-16 rounded-full" />
        </div>
        <Skeleton className="h-5 w-5 flex-shrink-0 rounded-full" />
      </div>
    </div>
  );
}

// Silueta de OrdersList desktop: header (título+subtítulo+3 botones) + búsqueda + tabs + tarjetas ≈176px
function DesktopOrdersListSkeleton() {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="flex-shrink-0 px-4 pt-2 pb-3 sm:px-7 sm:pt-3">
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-1.5">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-9 rounded-md" />
            <Skeleton className="h-9 w-9 rounded-md" />
            <Skeleton className="h-9 w-9 rounded-md" />
          </div>
        </div>
      </div>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-4 sm:px-7">
        <div className="mb-5 flex-shrink-0 space-y-4 pt-2">
          <Skeleton className="h-9 w-full rounded-md" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-16 rounded-md" />
            <Skeleton className="h-8 w-20 rounded-md" />
            <Skeleton className="h-8 w-16 rounded-md" />
          </div>
        </div>
        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden pt-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <DesktopOrderCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

// Silueta de OrderCard desktop: estado+fecha, id+tags, nombre (2 líneas), fecha/cajas (4 sub-bloques)
function DesktopOrderCardSkeleton() {
  return (
    <div className="space-y-2 rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-24 rounded-full" />
        <Skeleton className="h-3 w-10" />
      </div>
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-14 rounded-full" />
      </div>
      <div className="space-y-1.5">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
      <div className="flex items-center gap-4 pt-1">
        <div className="space-y-1">
          <Skeleton className="h-3 w-14" />
          <Skeleton className="h-3.5 w-10" />
        </div>
        <div className="space-y-1">
          <Skeleton className="h-3 w-10" />
          <Skeleton className="h-3.5 w-6" />
        </div>
      </div>
    </div>
  );
}
