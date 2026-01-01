/**
 * Asoc Export Helper
 * 
 * Contains logic for generating Excel rows and linkedSummary for Asoc documents
 */

import { parseDecimalValue, calculateImporte } from './common';
import { normalizeText } from '@/helpers/formats/texts';
import { 
    asocArmadoresPuntaDelMoral, 
    asocArmadoresPuntaDelMoralSubasta, 
    barcos, 
    productos, 
    servicioExtraAsocArmadoresPuntaDelMoral, 
    serviciosAsocArmadoresPuntaDelMoral 
} from '@/components/Admin/MarketDataExtractor/ListadoComprasAsocPuntaDelMoral/exportData';

/**
 * Generates Excel rows for an Asoc document
 * 
 * @param {Object} document - Processed Asoc document (with details, tables)
 * @param {Object} options - Options for generation
 * @param {string} options.CABSERIE - Serie code (default: "AS")
 * @param {number} options.startSequence - Starting sequence number (default: 1)
 * @returns {Object} Object with rows array and nextSequence number
 */
export function generateAsocExcelRows(document, options = {}) {
    const { CABSERIE = "AS", startSequence = 1 } = options;
    const { details: { fecha, tipoSubasta }, tables } = document;
    const fechaSoloNumeros = String(fecha).replace(/[^0-9]/g, '');
    let albaranSequence = startSequence;
    const processedRows = [];

    const isVentaDirecta = tipoSubasta == 'M1 M1';
    const isSubasta = tipoSubasta == 'T2 Arrastre';

    const cajasTotales = tables.subastas.reduce((acc, item) => {
        return acc + Number(item.cajas);
    }, 0);

    // Group subastas by barco
    const subastasGroupedByBarco = document.tables.subastas.reduce((acc, item) => {
        if (!acc[item.barco]) {
            acc[item.barco] = {
                nombre: item.barco,
                matricula: item.matricula,
                lineas: [],
            };
        }
        acc[item.barco].lineas.push(item);
        return acc;
    }, {});

    const subastas = Object.values(subastasGroupedByBarco);

    // Calculate importeTotalCalculado for services
    const importeTotalCalculado = tables.subastas.reduce((acc, linea) => {
        return acc + calculateImporte(linea.pesoNeto, linea.precio);
    }, 0);

    // Generate servicios
    const servicios = serviciosAsocArmadoresPuntaDelMoral.map((servicio) => {
        return {
            ...servicio,
            unidades: 1,
            base: importeTotalCalculado,
            precio: (importeTotalCalculado * servicio.porcentaje) / 100,
            importe: (importeTotalCalculado * servicio.porcentaje) / 100,
        };
    });

    // Add servicioExtra at position 1
    const servicioExtra = {
        ...servicioExtraAsocArmadoresPuntaDelMoral,
        unidades: 1,
        base: servicios.find((servicio) => servicio.descripcion === 'Tarifa G-4')?.importe || 0,
        precio: (servicios.find((servicio) => servicio.descripcion === 'Tarifa G-4')?.importe || 0) * servicioExtraAsocArmadoresPuntaDelMoral.porcentaje / 100,
        importe: (servicios.find((servicio) => servicio.descripcion === 'Tarifa G-4')?.importe || 0) * servicioExtraAsocArmadoresPuntaDelMoral.porcentaje / 100,
    };
    servicios.splice(1, 0, servicioExtra);

    // Group by barco (matricula)
    const groupedByBarco = subastas.reduce((acc, line) => {
        const key = line.matricula;
        if (!acc[key]) acc[key] = [];
        acc[key].push(line);
        return acc;
    }, {});

    // Generate rows for venta directa
    if (isVentaDirecta) {
        for (const [matricula, lines] of Object.entries(groupedByBarco)) {
            const barcoData = barcos.find(a => normalizeText(a.matricula) === normalizeText(matricula));
            if (!barcoData) {
                console.error(`Falta código de conversión para barco ${matricula}`);
                continue;
            }

            const cabNumDoc = `${fechaSoloNumeros}${albaranSequence}`;

            lines.forEach(l => {
                l.lineas.forEach(linea => {
                    const producto = productos.find(p => p.nombre === linea.especie);
                    processedRows.push({
                        CABSERIE: CABSERIE,
                        CABNUMDOC: cabNumDoc,
                        CABFECHA: fecha,
                        CABCODPRO: asocArmadoresPuntaDelMoral.codA3erp,
                        CABREFERENCIA: `ASOC - ${fecha} - ${barcoData.nombre}`,
                        LINCODART: producto?.codA3erp,
                        LINDESCLIN: linea.especie,
                        LINUNIDADES: parseDecimalValue(linea.pesoNeto),
                        LINPRCMONEDA: parseDecimalValue(linea.precio),
                        LINTIPIVA: 'RED10',
                    });
                });
            });

            albaranSequence++;
        }
    } else if (isSubasta) {
        const cabNumDoc = `${fechaSoloNumeros}${albaranSequence}`;

        document.tables.subastas.forEach(linea => {
            const producto = productos.find(p => p.nombre === linea.especie);
            processedRows.push({
                CABSERIE: CABSERIE,
                CABNUMDOC: cabNumDoc,
                CABFECHA: fecha,
                CABCODPRO: asocArmadoresPuntaDelMoralSubasta.codA3erp,
                CABREFERENCIA: `ASOC - ${fecha} - SUBASTA`,
                LINCODART: producto?.codA3erp,
                LINDESCLIN: linea.especie,
                LINUNIDADES: parseDecimalValue(linea.pesoNeto),
                LINPRCMONEDA: parseDecimalValue(linea.precio),
                LINTIPIVA: 'RED10',
            });
        });

        albaranSequence++;
    }

    // Generate rows for servicios
    const cabNumDocServicios = `${fechaSoloNumeros}${albaranSequence}`;
    servicios.forEach(line => {
        processedRows.push({
            CABSERIE: CABSERIE,
            CABNUMDOC: cabNumDocServicios,
            CABFECHA: fecha,
            CABCODPRO: isVentaDirecta ? asocArmadoresPuntaDelMoral.codA3erp : asocArmadoresPuntaDelMoralSubasta.codA3erp,
            CABREFERENCIA: isVentaDirecta ? `ASOC - ${fecha} - SERVICIOS` : `ASOC - ${fecha} - SERVICIOS SUBASTA`,
            LINCODART: 9999,
            LINDESCLIN: line.descripcion,
            LINUNIDADES: parseDecimalValue(line.unidades),
            LINPRCMONEDA: line.precio,
            LINTIPIVA: 'RED10',
        });
    });
    albaranSequence++;

    // Generate row for cajas if subasta
    if (isSubasta) {
        const cabNumDocCajas = `${fechaSoloNumeros}${albaranSequence}`;
        processedRows.push({
            CABSERIE: CABSERIE,
            CABNUMDOC: cabNumDocCajas,
            CABFECHA: fecha,
            CABCODPRO: asocArmadoresPuntaDelMoralSubasta.codA3erp,
            CABREFERENCIA: `ASOC - ${fecha} - SERVICIOS CAJAS SUBASTA`,
            LINCODART: 1015,
            LINDESCLIN: 'Préstamo cajas',
            LINUNIDADES: cajasTotales,
            LINPRCMONEDA: 5.50,
            LINTIPIVA: 'RED10',
        });
        albaranSequence++;
    }

    return {
        rows: processedRows,
        nextSequence: albaranSequence
    };
}

/**
 * Generates linkedSummary for an Asoc document
 * 
 * @param {Object} document - Processed Asoc document
 * @returns {Array} Array of linked summary objects
 */
export function generateAsocLinkedSummary(document) {
    const { details: { fecha }, tables } = document;

    // Group subastas by barco
    const subastasGroupedByBarco = document.tables.subastas.reduce((acc, item) => {
        if (!acc[item.barco]) {
            acc[item.barco] = {
                nombre: item.barco,
                matricula: item.matricula,
                lineas: [],
            };
        }
        acc[item.barco].lineas.push(item);
        return acc;
    }, {});

    const subastas = Object.values(subastasGroupedByBarco);

    return subastas.map((barco) => {
        const declaredTotalNetWeight = barco.lineas.reduce((acc, linea) => acc + parseDecimalValue(linea.pesoNeto), 0);
        const declaredTotalAmount = barco.lineas.reduce((acc, linea) => acc + calculateImporte(linea.pesoNeto, linea.precio), 0);

        const codBrisappBarco = barcos.find((barcoData) => normalizeText(barcoData.matricula) === normalizeText(barco.matricula))?.codBrisapp ?? null;

        return {
            supplierId: codBrisappBarco,
            date: fecha,
            declaredTotalNetWeight: parseFloat(declaredTotalNetWeight.toFixed(2)),
            declaredTotalAmount: parseFloat(declaredTotalAmount.toFixed(2)),
            barcoNombre: barco.nombre,
            error: codBrisappBarco === null ? true : false,
        };
    });
}

