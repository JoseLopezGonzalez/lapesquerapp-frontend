'use client';

import { useEffect, useMemo, useState } from 'react';
import { BookCheck, Loader2, Fish, Store, Package, Anchor } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { speciesService } from '@/services/domain/species/speciesService';
import {
  extractCatalogData,
  findVendiduriaInConfig,
  findProductoInConfig,
  findBarcoInConfig,
} from './catalogCheckUtils';
import SpeciesSection from './sections/SpeciesSection';
import VendiduriaSection from './sections/VendiduriaSection';
import LineProductsSection from './sections/LineProductsSection';
import BarcosSection from './sections/BarcosSection';

function SectionBadge({ total, missing }) {
  if (total === 0) return null;
  if (missing === 0) {
    return (
      <Badge
        variant="outline"
        className="ml-2 border-green-500/60 px-1.5 py-0 text-[10px] text-green-700"
      >
        {total} ok
      </Badge>
    );
  }
  return (
    <Badge
      variant="outline"
      className="ml-2 border-red-400/60 px-1.5 py-0 text-[10px] text-red-600"
    >
      {missing}/{total} sin registrar
    </Badge>
  );
}

export default function CatalogCheckDialog({ open, onOpenChange, documents }) {
  const [dbSpeciesMap, setDbSpeciesMap] = useState({});
  const [loadingSpecies, setLoadingSpecies] = useState(false);

  const catalogData = useMemo(() => extractCatalogData(documents || []), [documents]);

  // Load DB species by FAO code when the dialog opens.
  // One call per unique FAO — targeted and not limited by a page size.
  useEffect(() => {
    if (!open || catalogData.speciesFao.length === 0) return;

    setLoadingSpecies(true);
    const faoCodes = catalogData.speciesFao.map((s) => s.fao).filter(Boolean); // skip entries where extraction left fao empty

    Promise.all(
      faoCodes.map((fao) =>
        speciesService
          .list({ fao }, { page: 1, perPage: 10 })
          .then((response) => ({ fao, rows: response?.data || [] }))
          .catch(() => ({ fao, rows: [] }))
      )
    )
      .then((results) => {
        const map = {};
        for (const { fao, rows } of results) {
          const match = rows.find((s) => s.fao?.toUpperCase() === fao.toUpperCase());
          if (match) map[fao] = match;
        }
        setDbSpeciesMap(map);
      })
      .finally(() => setLoadingSpecies(false));
  }, [open, catalogData.speciesFao.length]);

  const handleSpeciesCreated = (newSpecies) => {
    if (newSpecies?.fao) {
      setDbSpeciesMap((prev) => ({ ...prev, [newSpecies.fao]: newSpecies }));
    }
  };

  const speciesMissing = catalogData.speciesFao.filter((s) => s.fao && !dbSpeciesMap[s.fao]).length;
  const vendiduriasMissing = catalogData.vendidurias.filter(
    (v) => !findVendiduriaInConfig(v.cod)
  ).length;
  const lineProductsMissing = catalogData.lineProducts.filter(
    (p) => !findProductoInConfig(p.nombre, p.docType)
  ).length;
  const barcosMissing = catalogData.barcos.filter(
    (b) => !findBarcoInConfig(b.nombre, b.docType, b.matricula)
  ).length;

  const hasLonja = documents?.some(
    (d) => d.documentType === 'listadoComprasLonjaDeIsla' && d.status === 'success'
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="6xl" className="flex h-[90vh] max-h-[90vh] flex-col overflow-hidden p-0">
        <DialogHeader className="shrink-0 border-b px-6 pt-6 pb-4">
          <div className="flex items-center gap-2">
            <BookCheck className="text-primary h-5 w-5" />
            <DialogTitle>Comprobación de catálogos</DialogTitle>
          </div>
          <DialogDescription>
            Verifica que todos los datos extraídos están correctamente registrados en el sistema.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="min-h-0 flex-1">
          <div className="px-6 py-4">
            <Accordion
              type="multiple"
              defaultValue={['species', 'vendidurias', 'lineProducts', 'barcos']}
            >
              {/* ── Especies FAO (only LonjaIsla) ── */}
              {hasLonja && (
                <AccordionItem
                  key={`species-${loadingSpecies ? 'loading' : 'ready'}-${catalogData.speciesFao.length}`}
                  value="species"
                >
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-2">
                      <Fish className="text-muted-foreground h-4 w-4" />
                      <span>Especies FAO</span>
                      {loadingSpecies ? (
                        <Loader2 className="text-muted-foreground ml-2 h-3 w-3 animate-spin" />
                      ) : (
                        <SectionBadge
                          total={catalogData.speciesFao.length}
                          missing={speciesMissing}
                        />
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-4">
                    {loadingSpecies ? (
                      <div className="text-muted-foreground flex items-center gap-2 py-4 text-sm">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Consultando catálogo de especies...
                      </div>
                    ) : (
                      <SpeciesSection
                        speciesFao={catalogData.speciesFao}
                        dbSpeciesMap={dbSpeciesMap}
                        onSpeciesCreated={handleSpeciesCreated}
                      />
                    )}
                  </AccordionContent>
                </AccordionItem>
              )}

              {/* ── Vendidurías (only LonjaIsla) ── */}
              {hasLonja && (
                <AccordionItem value="vendidurias">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-2">
                      <Store className="text-muted-foreground h-4 w-4" />
                      <span>Vendidurías</span>
                      <SectionBadge
                        total={catalogData.vendidurias.length}
                        missing={vendiduriasMissing}
                      />
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-4">
                    <VendiduriaSection vendidurias={catalogData.vendidurias} />
                  </AccordionContent>
                </AccordionItem>
              )}

              {/* ── Artículos de línea ── */}
              <AccordionItem value="lineProducts">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2">
                    <Package className="text-muted-foreground h-4 w-4" />
                    <span>Artículos de línea</span>
                    <SectionBadge
                      total={catalogData.lineProducts.length}
                      missing={lineProductsMissing}
                    />
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-4">
                  <LineProductsSection lineProducts={catalogData.lineProducts} />
                </AccordionContent>
              </AccordionItem>

              {/* ── Barcos ── */}
              <AccordionItem value="barcos">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2">
                    <Anchor className="text-muted-foreground h-4 w-4" />
                    <span>Barcos</span>
                    <SectionBadge total={catalogData.barcos.length} missing={barcosMissing} />
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-4">
                  <BarcosSection barcos={catalogData.barcos} />
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
