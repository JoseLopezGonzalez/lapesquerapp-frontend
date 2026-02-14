'use client';

import { ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SECTIONS_CONFIG, PRIMARY_SECTION_IDS_MOBILE } from '../config/sectionsConfig';

/**
 * Lista de secciones principales móvil (centrada, card estrecha)
 * Secciones: Previsión, Producción, Envío de Documentos
 */
export default function OrderSectionList({ onSelectSection, hasSafeAreaPadding }) {
  const primarySections = SECTIONS_CONFIG.filter((s) =>
    PRIMARY_SECTION_IDS_MOBILE.includes(s.id)
  );

  return (
    <div className="flex-1 w-full overflow-hidden min-h-0">
      <ScrollArea className="h-full w-full">
        <div
          className={`px-4 pt-8 flex justify-center ${hasSafeAreaPadding ? 'pb-8' : 'pb-2'}`}
          style={hasSafeAreaPadding ? { paddingBottom: 'env(safe-area-inset-bottom)' } : {}}
        >
          <Card className="w-full max-w-[280px] overflow-hidden">
            <CardContent className="p-0">
              <div className="divide-y divide-border/60">
                {primarySections.map((section) => {
                  const Icon = section.icon;
                  return (
                    <button
                      key={section.id}
                      type="button"
                      onClick={() => onSelectSection(section.id)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 min-h-[44px] text-left hover:bg-muted/40 active:bg-muted/50 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                    >
                      <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="flex-1 text-sm text-foreground">
                        {section.title}
                      </span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground/70 shrink-0" />
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
