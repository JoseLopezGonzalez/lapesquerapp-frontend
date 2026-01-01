/**
 * Cofra Export Helper
 * 
 * Contains logic for generating Excel rows and linkedSummary for Cofra documents
 */

import { parseDecimalValue, calculateImporte } from './common';
import { armadores, barcos, lonjas } from '@/components/Admin/MarketDataExtractor/AlbaranCofraWeb/exportData';

/**
 * Generates Excel rows for a Cofra document
 * 
 * @param {Object} document - Processed Cofra document (with detalles, tablas, subtotales)
 * @param {Object} options - Options for generation
 * @param {string} options.CABSERIE - Serie code (default: "CF")
 * @param {number} options.startSequence - Starting sequence number (default: 1)
 * @returns {Object} Object with rows array and nextSequence number
 */
export function generateCofraExcelRows(document, options = {}) {
    const { CABSERIE = "CF", startSequence = 1 } = options;
    const { detalles: { numero, fecha, cifLonja } } = document;
    const numeroLimpio = String(numero).replace(/[^0-9]/g, '');
    let albaranSequence = startSequence;
    const processedRows = [];

    // Group subastas by barco
    const subastasGroupedByBarco = document.tablas.subastas.reduce((acc, item) => {
        if (!acc[item.barco]) {
            acc[item.barco] = {
                nombre: item.barco,
                cod: item.cod,
                armador: item.armador,
                cifArmador: item.cifArmador,
                lineas: []
            };
        }
        acc[item.barco].lineas.push(item);
        return acc;
    }, {});
    const subastas = Object.values(subastasGroupedByBarco);

    // Group by armador
    const groupedByArmador = subastas.reduce((acc, line) => {
        const key = line.cifArmador;
        if (!acc[key]) acc[key] = [];
        acc[key].push(line);
        return acc;
    }, {});

    // Generate rows for each armador
    for (const [cifArmador, lines] of Object.entries(groupedByArmador)) {
        const armadorData = armadores.find(a => a.cif === cifArmador);
        if (!armadorData) {
            console.error(`Falta código de conversión para armador ${cifArmador}`);
            continue;
        }

        const cabNumDoc = `${numeroLimpio}${albaranSequence}`;

        lines.forEach(barco => {
            barco.lineas.forEach(linea => {
                processedRows.push({
                    CABSERIE: CABSERIE,
                    CABNUMDOC: cabNumDoc,
                    CABFECHA: fecha,
                    CABCODPRO: armadorData.codA3erp,
                    CABREFERENCIA: `COFRA - ${fecha} - ${numero} -  ${barco.nombre}`,
                    LINCODART: 95,
                    LINDESCLIN: 'PULPO FRESCO LONJA',
                    LINUNIDADES: parseDecimalValue(linea.kilos),
                    LINPRCMONEDA: parseDecimalValue(linea.precio),
                    LINTIPIVA: 'RED10',
                });
            });
        });

        albaranSequence++;
    }

    // Generate rows for lonja services
    const lonjaData = lonjas.find(l => l.cif === cifLonja);
    if (lonjaData) {
        const cabNumDoc = `${numeroLimpio}${albaranSequence}`;

        document.tablas.servicios.forEach(line => {
            const unidades = parseDecimalValue(line.unidades);
            const importe = parseDecimalValue(line.importe);
            const calculatedPrecio = unidades === 0 ? 0 : Number((importe / unidades).toFixed(4));
            processedRows.push({
                CABSERIE: CABSERIE,
                CABNUMDOC: cabNumDoc,
                CABFECHA: fecha,
                CABCODPRO: lonjaData.codA3erp,
                CABREFERENCIA: `COFRA - ${fecha} - ${numero} - SERVICIOS`,
                LINCODART: 9998,
                LINDESCLIN: line.descripcion,
                LINUNIDADES: line.unidades,
                LINPRCMONEDA: calculatedPrecio,
                LINTIPIVA: 'ORD21',
            });
        });

        albaranSequence++;
    }

    return {
        rows: processedRows,
        nextSequence: albaranSequence
    };
}

/**
 * Generates linkedSummary for a Cofra document
 * 
 * @param {Object} document - Processed Cofra document
 * @returns {Array} Array of linked summary objects
 */
export function generateCofraLinkedSummary(document) {
    const { detalles: { fecha } } = document;

    // Group subastas by barco
    const subastasGroupedByBarco = document.tablas.subastas.reduce((acc, item) => {
        if (!acc[item.barco]) {
            acc[item.barco] = {
                nombre: item.barco,
                cod: item.cod,
                armador: item.armador,
                cifArmador: item.cifArmador,
                lineas: []
            };
        }
        acc[item.barco].lineas.push(item);
        return acc;
    }, {});
    const subastas = Object.values(subastasGroupedByBarco);

    const calculateImporteFromLinea = (linea) => calculateImporte(linea.kilos, linea.precio);

    return subastas.map((barco) => {
        const declaredTotalNetWeight = barco.lineas.reduce((acc, linea) => acc + parseDecimalValue(linea.kilos), 0);
        const declaredTotalAmount = barco.lineas.reduce((acc, linea) => acc + calculateImporteFromLinea(linea), 0);

        const barcoEncontrado = barcos.find(b => b.barco === barco.nombre);

        const codBrisappArmador = barcoEncontrado?.codBrisapp ?? null;

        return {
            supplierId: codBrisappArmador,
            date: fecha,
            declaredTotalNetWeight: parseFloat(declaredTotalNetWeight.toFixed(2)),
            declaredTotalAmount: parseFloat(declaredTotalAmount.toFixed(2)),
            barcoNombre: barco.nombre,
            error: codBrisappArmador === null ? true : false,
        };
    });
}

