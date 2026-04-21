'use client';

import { Suspense } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Loader from '@/components/Utilities/Loader';
import { SECTIONS_CONFIG } from '../config/sectionsConfig';

const TAB_LABELS = {
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

/**
 * Tabs desktop: TabsList + TabsContent para todas las secciones del pedido
 */
export default function OrderTabsDesktop({ activeTab, onTabChange, blockedTabIds = [], palletsReadOnly = false }) {
  // Secciones bloqueadas para comercial cuando el pedido está en curso
  const allowedSections = SECTIONS_CONFIG.filter((section) => !blockedTabIds.includes(section.id));

  return (
    <div className="flex-1 w-full min-h-0 flex flex-col overflow-hidden">
      <div className="container mx-auto py-3 space-y-4 sm:space-y-8 h-full min-h-0 w-full flex flex-col">
        <Tabs value={activeTab} onValueChange={onTabChange} className="flex flex-col h-full min-h-0">
          <div className="mb-4 flex justify-start shrink-0 overflow-x-auto">
            <TabsList className="flex-nowrap w-fit">
              {allowedSections.map((section) => (
                <TabsTrigger
                  key={section.id}
                  value={section.id}
                >
                  {TAB_LABELS[section.id] ?? section.title}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto w-full">
            {allowedSections.map((section) => {
              const Component = section.component;
              const isLazy = section.lazy;
              const compactTabs = ['products', 'productDetails', 'analysis', 'production', 'pallets', 'documents', 'export', 'labels', 'map', 'incident', 'customer-history'];
              const tabClass = section.id === 'details'
                ? 'space-y-4 w-full h-full overflow-y-auto'
                : compactTabs.includes(section.id)
                  ? 'h-full min-h-0 flex flex-col'
                  : 'space-y-4 w-full h-full';
              const componentProps = section.id === 'pallets' ? { readOnly: palletsReadOnly } : {};

              return (
                <TabsContent
                  key={section.id}
                  value={section.id}
                  className={tabClass}
                >
                  {isLazy ? (
                    <Suspense
                      fallback={
                        <div className="h-full flex items-center justify-center">
                          <Loader />
                        </div>
                      }
                    >
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
