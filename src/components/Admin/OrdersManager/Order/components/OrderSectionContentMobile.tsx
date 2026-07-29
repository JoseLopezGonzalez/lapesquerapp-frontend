'use client';

import { Suspense, type ReactNode } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { SECTIONS_CONFIG } from '../config/sectionsConfig';

const SECTION_CONTAINER_CLASS = 'flex-1 w-full min-h-0 overflow-hidden px-4 py-4 flex flex-col';

function getFallback(activeSection: string): ReactNode {
  if (activeSection === 'customer-history') {
    return (
      <div className="flex h-32 w-full items-center justify-center">
        <Skeleton className="h-24 w-full rounded-lg" />
      </div>
    );
  }
  if (['export', 'pallets', 'maritime'].includes(activeSection)) {
    return (
      <div className="flex min-h-0 w-full flex-1 items-center justify-center">
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }
  return (
    <div className="flex h-full w-full items-center justify-center">
      <Skeleton className="h-64 w-full rounded-lg" />
    </div>
  );
}

interface OrderSectionContentMobileProps {
  activeSection: string;
  palletsReadOnly?: boolean;
  canViewCostData?: boolean;
  readOnly?: boolean;
}

/**
 * Contenido de sección móvil: renderiza el componente de SECTIONS_CONFIG según activeSection
 */
export default function OrderSectionContentMobile({
  activeSection,
  palletsReadOnly = false,
  canViewCostData = true,
  readOnly = false,
}: OrderSectionContentMobileProps) {
  const section = SECTIONS_CONFIG.find((s) => s.id === activeSection);
  if (!section) return null;

  const Component = section.component;
  const isLazy = section.lazy;

  if (activeSection === 'details') {
    return (
      <div className={SECTION_CONTAINER_CLASS}>
        <ScrollArea className="min-h-0 flex-1">
          <Component canViewCostData={canViewCostData} />
        </ScrollArea>
      </div>
    );
  }

  const componentProps =
    activeSection === 'pallets'
      ? { readOnly: palletsReadOnly, canViewCostData }
      : activeSection === 'maritime'
        ? { readOnly, canViewCostData }
        : { canViewCostData };

  return (
    <div className={SECTION_CONTAINER_CLASS}>
      {isLazy ? (
        <Suspense fallback={getFallback(activeSection)}>
          <Component {...componentProps} />
        </Suspense>
      ) : (
        <Component {...componentProps} />
      )}
    </div>
  );
}
