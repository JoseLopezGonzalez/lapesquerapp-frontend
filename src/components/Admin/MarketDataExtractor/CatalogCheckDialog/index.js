'use client';

import { useEffect, useMemo, useState } from 'react';
import { BookCheck, Loader2, Fish, Store, Package, Anchor } from 'lucide-react';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from '@/components/ui/sheet';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { speciesService } from '@/services/domain/species/speciesService';
import { extractCatalogData, findVendiduriaInConfig, findProductoInConfig, findBarcoInConfig } from './catalogCheckUtils';
import SpeciesSection from './sections/SpeciesSection';
import VendiduriaSection from './sections/VendiduriaSection';
import LineProductsSection from './sections/LineProductsSection';
import BarcosSection from './sections/BarcosSection';

function SectionBadge({ total, missing }) {
    if (total === 0) return null;
    if (missing === 0) {
        return (
            <Badge variant="outline" className="ml-2 text-green-700 border-green-500/60 text-[10px] px-1.5 py-0">
                {total} ok
            </Badge>
        );
    }
    return (
        <Badge variant="outline" className="ml-2 text-red-600 border-red-400/60 text-[10px] px-1.5 py-0">
            {missing}/{total} sin registrar
        </Badge>
    );
}

export default function CatalogCheckDialog({ open, onOpenChange, documents }) {
    const [dbSpeciesMap, setDbSpeciesMap] = useState({});
    const [loadingSpecies, setLoadingSpecies] = useState(false);

    const catalogData = useMemo(
        () => extractCatalogData(documents || []),
        [documents]
    );

    // Load DB species when the sheet opens
    useEffect(() => {
        if (!open || catalogData.speciesFao.length === 0) return;

        setLoadingSpecies(true);
        speciesService
            .list({}, { page: 1, perPage: 500 })
            .then((response) => {
                const rows = response?.data || [];
                const map = {};
                for (const s of rows) {
                    if (s.fao) map[s.fao] = s;
                }
                setDbSpeciesMap(map);
            })
            .catch(() => setDbSpeciesMap({}))
            .finally(() => setLoadingSpecies(false));
    }, [open, catalogData.speciesFao.length]);

    const handleSpeciesCreated = (newSpecies) => {
        if (newSpecies?.fao) {
            setDbSpeciesMap((prev) => ({ ...prev, [newSpecies.fao]: newSpecies }));
        }
    };

    const speciesMissing = catalogData.speciesFao.filter((s) => !dbSpeciesMap[s.fao]).length;
    const vendiduriasMissing = catalogData.vendidurias.filter((v) => !findVendiduriaInConfig(v.cod)).length;
    const lineProductsMissing = catalogData.lineProducts.filter((p) => !findProductoInConfig(p.nombre, p.docType)).length;
    const barcosMissing = catalogData.barcos.filter((b) => !findBarcoInConfig(b.nombre, b.docType, b.matricula)).length;

    const hasLonja = documents?.some((d) => d.documentType === 'listadoComprasLonjaDeIsla' && d.status === 'success');

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="right"
                className="w-[520px] sm:w-[620px] sm:max-w-none flex flex-col h-full p-0"
            >
                <SheetHeader className="px-6 pt-6 pb-4 border-b shrink-0">
                    <div className="flex items-center gap-2">
                        <BookCheck className="h-5 w-5 text-primary" />
                        <SheetTitle>Comprobación de catálogos</SheetTitle>
                    </div>
                    <SheetDescription>
                        Verifica que todos los datos extraídos están correctamente registrados en el sistema.
                    </SheetDescription>
                </SheetHeader>

                <ScrollArea className="flex-1 min-h-0">
                    <div className="px-6 py-4">
                        <Accordion type="multiple" defaultValue={['species', 'vendidurias', 'lineProducts', 'barcos']}>

                            {/* ── Especies FAO (only LonjaIsla) ── */}
                            {hasLonja && (
                                <AccordionItem value="species">
                                    <AccordionTrigger className="hover:no-underline">
                                        <div className="flex items-center gap-2">
                                            <Fish className="h-4 w-4 text-muted-foreground" />
                                            <span>Especies FAO</span>
                                            {loadingSpecies ? (
                                                <Loader2 className="h-3 w-3 animate-spin ml-2 text-muted-foreground" />
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
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
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
                                            <Store className="h-4 w-4 text-muted-foreground" />
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
                                        <Package className="h-4 w-4 text-muted-foreground" />
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
                                        <Anchor className="h-4 w-4 text-muted-foreground" />
                                        <span>Barcos</span>
                                        <SectionBadge
                                            total={catalogData.barcos.length}
                                            missing={barcosMissing}
                                        />
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="pb-4">
                                    <BarcosSection barcos={catalogData.barcos} />
                                </AccordionContent>
                            </AccordionItem>

                        </Accordion>
                    </div>
                </ScrollArea>
            </SheetContent>
        </Sheet>
    );
}
