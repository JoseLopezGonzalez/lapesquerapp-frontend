'use client';

import { ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SECTIONS_CONFIG, PRIMARY_SECTION_IDS_MOBILE } from '../config/sectionsConfig';

/**
 * Lista de secciones principales móvil (centrada, card estrecha)
 * Secciones: Previsión, Producción, Envío de Documentos
 */
export default function OrderSectionList({
  onSelectSection,
  hasSafeAreaPadding,
  blockedTabIds = [],
}) {
  const primarySections = SECTIONS_CONFIG.filter((s) => PRIMARY_SECTION_IDS_MOBILE.includes(s.id));
  const visiblePrimarySections = primarySections.filter((s) => !blockedTabIds.includes(s.id));

  return (
    <div className="min-h-0 w-full flex-1 overflow-hidden">
      <ScrollArea className="h-full w-full">
        <div
          className={`flex justify-center px-4 pt-8 ${hasSafeAreaPadding ? 'pb-8' : 'pb-2'}`}
          style={hasSafeAreaPadding ? { paddingBottom: 'env(safe-area-inset-bottom)' } : {}}
        >
          <Card className="w-full max-w-[280px] overflow-hidden">
            <CardContent className="p-0">
              <div className="divide-border/60 divide-y">
                {visiblePrimarySections.map((section) => {
                  const Icon = section.icon;
                  return (
                    <button
                      key={section.id}
                      type="button"
                      onClick={() => onSelectSection(section.id)}
                      className="hover:bg-muted/40 active:bg-muted/50 focus-visible:ring-ring flex min-h-[44px] w-full items-center gap-3 px-3 py-2.5 text-left transition-colors outline-none focus-visible:ring-2 focus-visible:ring-inset"
                    >
                      <Icon className="text-muted-foreground h-4 w-4 shrink-0" />
                      <span className="text-foreground flex-1 text-sm">{section.title}</span>
                      <ChevronRight className="text-muted-foreground/70 h-4 w-4 shrink-0" />
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </div>
  );
}
