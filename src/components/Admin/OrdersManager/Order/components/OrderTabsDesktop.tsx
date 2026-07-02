'use client';

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { SECTIONS_CONFIG } from '../config/sectionsConfig';

const TAB_LABELS: Record<string, string> = {
  details: 'Información',
  products: 'Previsión',
  productDetails: 'Detalle productos',
  analysis: 'Análisis',
  production: 'Producción',
  labels: 'Etiquetas',
  pallets: 'Palets',
  documents: 'Envio de Documentos',
  export: 'Descargas',
  map: 'Ruta',
  incident: 'Incidencia',
  'customer-history': 'Histórico',
};

interface OrderTabsDesktopProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  blockedTabIds?: string[];
  palletsReadOnly?: boolean;
}

/**
 * Tabs desktop: TabsList + TabsContent para todas las secciones del pedido
 */
export default function OrderTabsDesktop({
  activeTab,
  onTabChange,
  blockedTabIds = [],
  palletsReadOnly = false,
}: OrderTabsDesktopProps) {
  // Secciones bloqueadas para comercial cuando el pedido está en curso
  const allowedSections = SECTIONS_CONFIG.filter((section) => !blockedTabIds.includes(section.id));

  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollAffordance = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateScrollAffordance();

    el.addEventListener('scroll', updateScrollAffordance, { passive: true });
    const resizeObserver = new ResizeObserver(updateScrollAffordance);
    resizeObserver.observe(el);

    return () => {
      el.removeEventListener('scroll', updateScrollAffordance);
      resizeObserver.disconnect();
    };
  }, [updateScrollAffordance, allowedSections.length]);

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col overflow-hidden">
      <div className="container mx-auto flex h-full min-h-0 w-full flex-col gap-4 py-3 sm:gap-8">
        <Tabs
          value={activeTab}
          onValueChange={onTabChange}
          className="flex h-full min-h-0 flex-col"
        >
          <div className="relative mb-4 shrink-0">
            <div
              className={cn(
                'from-background pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r to-transparent transition-opacity',
                canScrollLeft ? 'opacity-100' : 'opacity-0'
              )}
            />
            <div
              className={cn(
                'from-background pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l to-transparent transition-opacity',
                canScrollRight ? 'opacity-100' : 'opacity-0'
              )}
            />
            <div ref={scrollRef} className="flex justify-start overflow-x-auto">
              <TabsList className="w-fit flex-nowrap">
                {allowedSections.map((section) => (
                  <TabsTrigger key={section.id} value={section.id}>
                    {TAB_LABELS[section.id] ?? section.title}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
          </div>
          <div className="min-h-0 w-full flex-1 overflow-y-auto">
            {allowedSections.map((section) => {
              const Component = section.component;
              const isLazy = section.lazy;
              const compactTabs = [
                'products',
                'productDetails',
                'analysis',
                'production',
                'pallets',
                'documents',
                'export',
                'labels',
                'map',
                'incident',
                'customer-history',
              ];
              const tabClass =
                section.id === 'details'
                  ? 'flex w-full h-full flex-col gap-4 overflow-y-auto'
                  : compactTabs.includes(section.id)
                    ? 'h-full min-h-0 flex flex-col'
                    : 'flex w-full h-full flex-col gap-4';
              const componentProps = section.id === 'pallets' ? { readOnly: palletsReadOnly } : {};

              return (
                <TabsContent key={section.id} value={section.id} className={tabClass}>
                  {isLazy ? (
                    <Suspense fallback={<Skeleton className="h-64 w-full rounded-lg" />}>
                      <Component {...componentProps} />
                    </Suspense>
                  ) : (
                    <Component {...componentProps} />
                  )}
                </TabsContent>
              );
            })}
          </div>
        </Tabs>
      </div>
    </div>
  );
}
