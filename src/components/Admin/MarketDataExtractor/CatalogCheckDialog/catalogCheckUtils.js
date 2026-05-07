import { normalizeText } from '@/helpers/formats/texts';
import { barcos as barcosLonja, datosVendidurias, productos as productosLonja } from '@/components/Admin/MarketDataExtractor/ListadoComprasLonjaDeIsla/exportData';
import { barcos as barcosCofra } from '@/components/Admin/MarketDataExtractor/AlbaranCofraWeb/exportData';
import { barcos as barcosAsoc, productos as productosAsoc } from '@/components/Admin/MarketDataExtractor/ListadoComprasAsocPuntaDelMoral/exportData';

const DOC_TYPES = {
    LONJA: 'listadoComprasLonjaDeIsla',
    COFRA: 'albaranCofradiaPescadoresSantoCristoDelMar',
    ASOC: 'listadoComprasAsocArmadoresPuntaDelMoral',
};

/**
 * Extracts and deduplicates all catalog-relevant data from a set of processed documents.
 * Returns arrays used by each panel section.
 */
export function extractCatalogData(documents) {
    const speciesFaoMap = new Map();
    const vendiduriaMap = new Map();
    const lineProductMap = new Map();
    const barcoMap = new Map();

    for (const doc of documents) {
        if (doc.status !== 'success' || !doc.processedData?.[0]) continue;
        const data = doc.processedData[0];
        const docType = doc.documentType;

        if (docType === DOC_TYPES.LONJA) {
            for (const row of data.tables?.peces || []) {
                if (row.fao && !speciesFaoMap.has(row.fao)) {
                    speciesFaoMap.set(row.fao, { fao: row.fao, descripcion: row.descripcion });
                }
            }
            for (const row of data.tables?.vendidurias || []) {
                const key = row.cod || String(row.vendiduria || '').split(' ')[0];
                if (key && !vendiduriaMap.has(key)) {
                    vendiduriaMap.set(key, { cod: key, vendiduria: row.vendiduria });
                }
            }
            for (const row of data.tables?.ventas || []) {
                if (row.especie) {
                    const key = normalizeText(row.especie);
                    if (!lineProductMap.has(key)) {
                        lineProductMap.set(key, { nombre: row.especie, docType });
                    }
                }
            }
            for (const row of data.tables?.ventas || []) {
                if (row.barco) {
                    const key = normalizeText(row.barco);
                    if (!barcoMap.has(key)) {
                        barcoMap.set(key, { nombre: row.barco, docType });
                    }
                }
            }
        } else if (docType === DOC_TYPES.COFRA) {
            for (const row of data.tablas?.subastas || []) {
                if (row.barco) {
                    const key = normalizeText(row.barco);
                    if (!barcoMap.has(key)) {
                        barcoMap.set(key, {
                            nombre: row.barco,
                            docType,
                            armador: row.armador || null,
                            cifArmador: row.cifArmador || null,
                        });
                    }
                }
            }
        } else if (docType === DOC_TYPES.ASOC) {
            for (const row of data.tables?.subastas || []) {
                if (row.especie) {
                    const key = normalizeText(row.especie);
                    if (!lineProductMap.has(key)) {
                        lineProductMap.set(key, { nombre: row.especie, docType });
                    }
                }
                if (row.barco) {
                    const key = normalizeText(row.barco);
                    if (!barcoMap.has(key)) {
                        barcoMap.set(key, {
                            nombre: row.barco,
                            docType,
                            matricula: row.matricula || null,
                        });
                    }
                }
            }
        }
    }

    return {
        speciesFao: Array.from(speciesFaoMap.values()),
        vendidurias: Array.from(vendiduriaMap.values()),
        lineProducts: Array.from(lineProductMap.values()),
        barcos: Array.from(barcoMap.values()),
    };
}

// ─── Static config lookup helpers ────────────────────────────────────────────

export function findVendiduriaInConfig(cod) {
    return datosVendidurias.find((v) => v.cod === cod) || null;
}

export function findProductoInConfig(nombre, docType) {
    const catalog = docType === DOC_TYPES.ASOC ? productosAsoc : productosLonja;
    return catalog.find((p) => normalizeText(p.nombre) === normalizeText(nombre)) || null;
}

export function findBarcoInConfig(nombre, docType, matricula) {
    if (docType === DOC_TYPES.LONJA) {
        return barcosLonja.find((b) => normalizeText(b.barco) === normalizeText(nombre)) || null;
    }
    if (docType === DOC_TYPES.COFRA) {
        return barcosCofra.find((b) => normalizeText(b.barco) === normalizeText(nombre)) || null;
    }
    if (docType === DOC_TYPES.ASOC) {
        return (
            barcosAsoc.find((b) => normalizeText(b.nombre) === normalizeText(nombre)) ||
            (matricula
                ? barcosAsoc.find((b) => normalizeText(b.matricula) === normalizeText(matricula))
                : null) ||
            null
        );
    }
    return null;
}

// ─── Copy-to-clipboard helpers ────────────────────────────────────────────────

export function buildVendiduriaEntry(item) {
    return `{ cod: '${item.cod}', nombre: '${item.vendiduria}', codA3erp: '' }`;
}

export function buildProductoEntry(item) {
    return `{ nombre: '${item.nombre}', codA3erp: '', codBrisappProducto: '' }`;
}

export function buildBarcoEntry(item) {
    if (item.docType === DOC_TYPES.LONJA) {
        return `{ barco: '${item.nombre}', vendiduria: '', codVendiduria: '' }`;
    }
    if (item.docType === DOC_TYPES.COFRA) {
        return `{ barco: '${item.nombre}', armador: '${item.armador || ''}', cifArmador: '${item.cifArmador || ''}', codA3erp: '', codBrisapp: '' }`;
    }
    if (item.docType === DOC_TYPES.ASOC) {
        return `{ nombre: '${item.nombre}', matricula: '${item.matricula || ''}', cifArmador: '', codA3erp: '', codBrisapp: '' }`;
    }
    return `{ barco: '${item.nombre}' }`;
}

export function getDocTypeLabel(docType) {
    if (docType === DOC_TYPES.LONJA) return 'Lonja de Isla';
    if (docType === DOC_TYPES.COFRA) return 'Cofradía';
    if (docType === DOC_TYPES.ASOC) return 'Asoc. Armadores';
    return docType;
}
