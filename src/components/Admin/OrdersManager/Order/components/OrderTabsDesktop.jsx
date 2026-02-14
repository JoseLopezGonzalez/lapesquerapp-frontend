'use client';

import { Suspense } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Loader from '@/components/Utilities/Loader';
import { SECTIONS_CONFIG } from '../config/sectionsConfig';

const TAB_LABELS = {
  details: 'Información',
  products: 'Previsión',
  productDetails: 'Detalle productos',
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
export default function OrderTabsDesktop({ activeTab, onTabChange }) {
  return (
    <div className="flex-1 w-full overflow-y-hidden">
      <div className="container mx-auto py-3 space-y-4 sm:space-y-8 h-full w-full">
        <Tabs value={activeTab} onValueChange={onTabChange} className="h-full flex flex-col w-full">
          <div className="mb-4 flex justify-start">
            <TabsList className="w-fit inline-flex">
              {SECTIONS_CONFIG.map((section) => (
                <TabsTrigger
                  key={section.id}
                  value={section.id}
                  className="text-xs sm:text-sm whitespace-nowrap"
                >
                  {TAB_LABELS[section.id] ?? section.title}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
          <div className="flex-1 overflow-y-hidden w-full">
            {SECTIONS_CONFIG.map((section) => {
              const Component = section.component;
              const isLazy = section.lazy;
              const compactTabs = ['pallets', 'documents', 'export', 'labels', 'map', 'incident', 'customer-history'];
              const tabClass = section.id === 'details'
                ? 'space-y-4 w-full h-full overflow-y-auto'
                : compactTabs.includes(section.id)
                  ? 'h-full'
                  : 'space-y-4 w-full h-full';
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
                      <Component />
                    </Suspense>
                  ) : (
                    <Component />
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
