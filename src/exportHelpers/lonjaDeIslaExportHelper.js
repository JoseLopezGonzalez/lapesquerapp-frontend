/**
 * LonjaDeIsla Export Helper
 * 
 * Contains logic for generating Excel rows and linkedSummary for LonjaDeIsla documents
 */

import { parseDecimalValue, calculateImporte } from './common';
import { parseEuropeanNumber } from '@/helpers/formats/numbers/formatNumbers';
import { 
    barcos, 
    barcosVentaDirecta, 
    datosVendidurias, 
    lonjaDeIsla, 
    PORCENTAJE_SERVICIOS_VENDIDURIAS, 
    productos, 
    servicioExtraLonjaDeIsla, 
    serviciosLonjaDeIsla 
} from '@/components/Admin/MarketDataExtractor/ListadoComprasLonjaDeIsla/exportData';

/**
 * Generates Excel rows for a LonjaDeIsla document
 * 
 * @param {Object} document - Processed LonjaDeIsla document (with details, tables)
 * @param {Object} options - Options for generation
 * @param {string} options.CABSERIE - Serie code (default: "LI")
 * @param {number} options.startSequence - Starting sequence number (default: 1)
 * @returns {Object} Object with rows array and nextSequence number
 */
export function generateLonjaDeIslaExcelRows(document, options = {}) {
    const { CABSERIE = "LI", startSequence = 1 } = options;
    const { details: { fecha }, tables: { ventas, vendidurias } } = document;
    const fechaSoloNumeros = String(fecha).replace(/[^0-9]/g, '');
    let albaranSequence = startSequence;
    const processedRows = [];

    // Helper functions
    const calculateImporteFromLinea = (linea) => calculateImporte(linea.kilos, linea.precio);
    
    const isConvertibleBarco = (cod) => {
        return barcos.some((barco) => barco.cod === cod);
    };

    // Process ventas into ventasVendidurias and ventasDirectas
    const ventasVendidurias = [];
    const ventasDirectas = [];

    ventas.forEach((venta) => {
        const barcoEncontrado = barcos.find((barco) => 
            barco.cod === venta.codBarco || barco.barco === venta.barco
        );

        if (!barcoEncontrado) {
            return;
        }

        const nombreBarco = barcoEncontrado.barco;
        const codBarco = `${barcoEncontrado.cod}`;

        const barcoVentaDirectaEncontrado = barcosVentaDirecta.find((barco) => barco.cod === codBarco);

        if (!barcoVentaDirectaEncontrado) {
            const vendiduria = datosVendidurias.find((vendiduria) => vendiduria.cod === barcoEncontrado.codVendiduria);

            if (!vendiduria) {
                return;
            }

            if (!ventasVendidurias[codBarco]) {
                ventasVendidurias[codBarco] = {
                    cod: codBarco,
                    nombre: nombreBarco,
                    vendiduria: vendiduria,
                    lineas: [],
                };
            }
            ventasVendidurias[codBarco].lineas.push(venta);
        } else {
            const armador = barcoVentaDirectaEncontrado.armador;
            if (!ventasDirectas[codBarco]) {
                ventasDirectas[codBarco] = {
                    cod: codBarco,
                    nombre: nombreBarco,
                    armador: armador,
                    lineas: [],
                };
            }
            ventasDirectas[codBarco].lineas.push(venta);
        }
    });

    // Calculate importeTotalVentasDirectas for services
    const importeTotalVentasDirectas = Object.values(ventasDirectas).reduce((acc, barco) => {
        return acc + barco.lineas.reduce((acc, linea) => {
            return acc + calculateImporteFromLinea(linea);
        }, 0);
    }, 0);

    // Generate servicios
    const servicios = serviciosLonjaDeIsla.map((servicio) => {
        return {
            ...servicio,
            unidades: 1,
            base: importeTotalVentasDirectas,
            precio: (importeTotalVentasDirectas * servicio.porcentaje) / 100,
            importe: (importeTotalVentasDirectas * servicio.porcentaje) / 100,
        };
    });

    // Add servicioExtra at position 1
    const servicioExtra = {
        ...servicioExtraLonjaDeIsla,
        unidades: 1,
        base: servicios.find((servicio) => servicio.descripcion === 'REPERCUSION TARIFA G-4 COMP.')?.importe || 0,
        precio: (servicios.find((servicio) => servicio.descripcion === 'REPERCUSION TARIFA G-4 COMP.')?.importe || 0) * servicioExtraLonjaDeIsla.porcentaje / 100,
        importe: (servicios.find((servicio) => servicio.descripcion === 'REPERCUSION TARIFA G-4 COMP.')?.importe || 0) * servicioExtraLonjaDeIsla.porcentaje / 100,
    };
    servicios.splice(1, 0, servicioExtra);

    // Helper function
    const getImporteTotal = (lineasBarco) => {
        return lineasBarco.reduce((acc, linea) => {
            return acc + calculateImporteFromLinea(linea);
        }, 0);
    };

    // Generate rows for ventasDirectas
    Object.values(ventasDirectas).forEach(barco => {
        const cabNumDoc = `${fechaSoloNumeros}${albaranSequence}`;
        barco.lineas.forEach(linea => {
            const producto = productos.find(p => p.nombre == linea.especie);
            processedRows.push({
                CABSERIE: CABSERIE,
                CABNUMDOC: cabNumDoc,
                CABFECHA: fecha,
                CABCODPRO: barco.armador.codA3erp,
                CABREFERENCIA: `LONJA - ${fecha} - ${barco.nombre}`,
                LINCODART: producto?.codA3erp,
                LINDESCLIN: linea.especie,
                LINUNIDADES: parseDecimalValue(linea.kilos),
                LINPRCMONEDA: parseDecimalValue(linea.precio),
                LINTIPIVA: 'RED10',
            });
        });
        albaranSequence++;
    });

    // Generate rows for ventasVendidurias
    Object.values(ventasVendidurias).filter(Boolean).forEach(barco => {
        const cabNumDoc = `${fechaSoloNumeros}${albaranSequence}`;
        if (isConvertibleBarco(barco.cod)) {
            barco.lineas.forEach(linea => {
                const producto = productos.find(p => p.nombre == linea.especie);
                processedRows.push({
                    CABSERIE: CABSERIE,
                    CABNUMDOC: cabNumDoc,
                    CABFECHA: fecha,
                    CABCODPRO: barco.vendiduria.codA3erp,
                    CABREFERENCIA: `LONJA - ${fecha} - ${barco.nombre}`,
                    LINCODART: producto?.codA3erp,
                    LINDESCLIN: linea.especie,
                    LINUNIDADES: parseDecimalValue(linea.kilos),
                    LINPRCMONEDA: parseDecimalValue(linea.precio),
                    LINTIPIVA: 'RED10',
                });
            });
        }

        const importeTotal = getImporteTotal(barco.lineas);

        processedRows.push({
            CABSERIE: CABSERIE,
            CABNUMDOC: cabNumDoc,
            CABFECHA: fecha,
            CABCODPRO: lonjaDeIsla.codA3erp,
            CABREFERENCIA: `LONJA - ${fecha} - ${barco.nombre}`,
            LINCODART: 9999,
            LINDESCLIN: 'Gastos de Lonja y OP',
            LINUNIDADES: 1,
            LINPRCMONEDA: importeTotal * PORCENTAJE_SERVICIOS_VENDIDURIAS / 100,
            LINTIPIVA: 'RED10',
        });
        albaranSequence++;
    });

    // Generate rows for servicios
    const cabNumDocServicios = `${fechaSoloNumeros}${albaranSequence}`;
    servicios.forEach(line => {
        processedRows.push({
            CABSERIE: CABSERIE,
            CABNUMDOC: cabNumDocServicios,
            CABFECHA: fecha,
            CABCODPRO: lonjaDeIsla.codA3erp,
            CABREFERENCIA: `LONJA - ${fecha} - SERVICIOS`,
            LINCODART: 9999,
            LINDESCLIN: line.descripcion,
            LINUNIDADES: line.unidades,
            LINPRCMONEDA: line.precio,
            LINTIPIVA: 'RED10',
        });
    });
    albaranSequence++;

    return {
        rows: processedRows,
        nextSequence: albaranSequence
    };
}

/**
 * Generates linkedSummary for a LonjaDeIsla document
 * 
 * @param {Object} document - Processed LonjaDeIsla document
 * @returns {Array} Array of linked summary objects
 */
export function generateLonjaDeIslaLinkedSummary(document) {
    const { details: { fecha }, tables: { ventas } } = document;

    const calculateImporteFromLinea = (linea) => calculateImporte(linea.kilos, linea.precio);

    // Process ventas into ventasVendidurias and ventasDirectas (same logic as Excel generation)
    const ventasVendidurias = [];
    const ventasDirectas = [];

    ventas.forEach((venta) => {
        const barcoEncontrado = barcos.find((barco) => 
            barco.cod === venta.codBarco || barco.barco === venta.barco
        );

        if (!barcoEncontrado) {
            return;
        }

        const nombreBarco = barcoEncontrado.barco;
        const codBarco = `${barcoEncontrado.cod}`;

        const barcoVentaDirectaEncontrado = barcosVentaDirecta.find((barco) => barco.cod === codBarco);

        if (!barcoVentaDirectaEncontrado) {
            const vendiduria = datosVendidurias.find((vendiduria) => vendiduria.cod === barcoEncontrado.codVendiduria);

            if (!vendiduria) {
                return;
            }

            if (!ventasVendidurias[codBarco]) {
                ventasVendidurias[codBarco] = {
                    cod: codBarco,
                    nombre: nombreBarco,
                    vendiduria: vendiduria,
                    lineas: [],
                };
            }
            ventasVendidurias[codBarco].lineas.push(venta);
        } else {
            const armador = barcoVentaDirectaEncontrado.armador;
            if (!ventasDirectas[codBarco]) {
                ventasDirectas[codBarco] = {
                    cod: codBarco,
                    nombre: nombreBarco,
                    armador: armador,
                    lineas: [],
                };
            }
            ventasDirectas[codBarco].lineas.push(venta);
        }
    });

    // Generate linkedSummary from ventasVendidurias
    const linkedSummaryVendidurias = Object.values(ventasVendidurias).filter(Boolean).map((venta) => {
        const declaredTotalNetWeight = venta.lineas.reduce((acc, linea) => acc + parseDecimalValue(linea.kilos), 0);
        const declaredTotalAmount = venta.lineas.reduce((acc, linea) => acc + calculateImporteFromLinea(linea), 0);
        const codBrisappBarco = barcos.find((barco) => barco.cod === venta.cod)?.codBrisapp ?? null;

        return {
            supplierId: codBrisappBarco,
            date: fecha,
            declaredTotalNetWeight: parseFloat(declaredTotalNetWeight.toFixed(2)),
            declaredTotalAmount: parseFloat(declaredTotalAmount.toFixed(2)),
            barcoNombre: venta.nombre,
            error: codBrisappBarco === null ? true : false,
        };
    });

    // Generate linkedSummary from ventasDirectas
    const linkedSummaryDirectas = Object.values(ventasDirectas).filter(Boolean).map((venta) => {
        const declaredTotalNetWeight = venta.lineas.reduce((acc, linea) => acc + parseDecimalValue(linea.kilos), 0);
        const declaredTotalAmount = venta.lineas.reduce((acc, linea) => acc + calculateImporteFromLinea(linea), 0);
        const codBrisappBarco = barcos.find((barco) => barco.cod === venta.cod)?.codBrisapp ?? null;

        return {
            supplierId: codBrisappBarco,
            date: fecha,
            declaredTotalNetWeight: parseFloat(declaredTotalNetWeight.toFixed(2)),
            declaredTotalAmount: parseFloat(declaredTotalAmount.toFixed(2)),
            barcoNombre: venta.nombre,
            error: codBrisappBarco === null ? true : false,
        };
    });

    return [...linkedSummaryVendidurias, ...linkedSummaryDirectas];
}

