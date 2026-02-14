'use client';

import { Suspense } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import Loader from '@/components/Utilities/Loader';
import { SECTIONS_CONFIG } from '../config/sectionsConfig';

const SECTION_CONTAINER_CLASS = 'flex-1 w-full min-h-0 overflow-hidden px-4 py-4 flex flex-col';

function getFallback(activeSection) {
  if (activeSection === 'customer-history') {
    return (
      <div className="h-32 flex items-center justify-center">
        <Loader />
      </div>
    );
  }
  if (['export', 'pallets'].includes(activeSection)) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-0">
        <Loader />
      </div>
    );
  }
  return (
    <div className="h-full flex items-center justify-center">
      <Loader />
    </div>
  );
}

/**
 * Contenido de sección móvil: renderiza el componente de SECTIONS_CONFIG según activeSection
 */
export default function OrderSectionContentMobile({ activeSection }) {
  const section = SECTIONS_CONFIG.find((s) => s.id === activeSection);
  if (!section) return null;

  const Component = section.component;
  const isLazy = section.lazy;

  if (activeSection === 'details') {
    return (
      <div className={SECTION_CONTAINER_CLASS}>
        <ScrollArea className="flex-1 min-h-0">
          <Component />
        </ScrollArea>
      </div>
    );
  }

  return (
    <div className={SECTION_CONTAINER_CLASS}>
      {isLazy ? (
        <Suspense fallback={getFallback(activeSection)}>
          <Component />
        </Suspense>
      ) : (
        <Component />
      )}
    </div>
  );
}
