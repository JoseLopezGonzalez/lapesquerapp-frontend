/**
 * Repercusión de la tasa a la pesca fresca (T4 / normativa puertos) en exportaciones
 * Lonja de Isla y ASOC Punta del Moral.
 *
 * `applyFullTasaPescaRepercusion === false`: sin repercutir T4 (porcentajes reducidos acordados).
 * Por defecto `true` (comportamiento histórico).
 */

import {
    serviciosLonjaDeIsla,
    servicioExtraLonjaDeIsla,
} from '@/components/Admin/MarketDataExtractor/ListadoComprasLonjaDeIsla/exportData';
import {
    serviciosAsocArmadoresPuntaDelMoral,
    servicioExtraAsocArmadoresPuntaDelMoral,
} from '@/components/Admin/MarketDataExtractor/ListadoComprasAsocPuntaDelMoral/exportData';

const LONJA_ISLA_SERVICIOS_SIN_REPERCUSION_T4 = new Set([
    'USO LONJA 1% COMPRADORES',
    'SERVICIO MANIPULACION COMPRAS',
]);

const ASOC_SERVICIOS_SIN_REPERCUSION_T4 = new Set(['Gastos Lonja', 'Gastos Gestion Cobros']);

/**
 * @param {Object} [options]
 * @param {boolean} [options.applyFullTasaPescaRepercusion]
 * @returns {boolean}
 */
export function shouldApplyFullTasaPescaRepercusion(options = {}) {
    return options.applyFullTasaPescaRepercusion !== false;
}

/**
 * % sobre importe mercancía vendiduría / subasta — línea "Gastos de Lonja y OP".
 * @param {boolean} applyFull
 * @returns {number}
 */
export function getPorcentajeGastosLonjaOpVendiduria(applyFull) {
    return applyFull ? 3.5 : 1.5;
}

/**
 * Servicios Lonja de Isla (contrato), base = importe total venta directa.
 * @param {boolean} applyFull
 * @param {number} importeTotalVentasDirectas
 * @returns {Array<Object>}
 */
export function buildLonjaDeIslaServiciosCalculados(applyFull, importeTotalVentasDirectas) {
    const base = importeTotalVentasDirectas;
    if (applyFull) {
        const servicios = serviciosLonjaDeIsla.map((servicio) => ({
            ...servicio,
            unidades: 1,
            base,
            precio: (base * servicio.porcentaje) / 100,
            importe: (base * servicio.porcentaje) / 100,
        }));
        const g4Importe =
            servicios.find((s) => s.descripcion === 'REPERCUSION TARIFA G-4 COMP.')?.importe ?? 0;
        const servicioExtra = {
            ...servicioExtraLonjaDeIsla,
            unidades: 1,
            base: g4Importe,
            precio: (g4Importe * servicioExtraLonjaDeIsla.porcentaje) / 100,
            importe: (g4Importe * servicioExtraLonjaDeIsla.porcentaje) / 100,
        };
        servicios.splice(1, 0, servicioExtra);
        return servicios;
    }
    return serviciosLonjaDeIsla
        .filter((s) => LONJA_ISLA_SERVICIOS_SIN_REPERCUSION_T4.has(s.descripcion))
        .map((servicio) => ({
            ...servicio,
            unidades: 1,
            base,
            precio: (base * servicio.porcentaje) / 100,
            importe: (base * servicio.porcentaje) / 100,
        }));
}

/**
 * Servicios ASOC, base = importe total subastas.
 * @param {boolean} applyFull
 * @param {number} importeTotalCalculado
 * @returns {Array<Object>}
 */
export function buildAsocServiciosCalculados(applyFull, importeTotalCalculado) {
    const base = importeTotalCalculado;
    if (applyFull) {
        const servicios = serviciosAsocArmadoresPuntaDelMoral.map((servicio) => ({
            ...servicio,
            unidades: 1,
            base,
            precio: (base * servicio.porcentaje) / 100,
            importe: (base * servicio.porcentaje) / 100,
        }));
        const tarifaG4 = servicios.find((s) => s.descripcion === 'Tarifa G-4')?.importe ?? 0;
        const servicioExtra = {
            ...servicioExtraAsocArmadoresPuntaDelMoral,
            unidades: 1,
            base: tarifaG4,
            precio: (tarifaG4 * servicioExtraAsocArmadoresPuntaDelMoral.porcentaje) / 100,
            importe: (tarifaG4 * servicioExtraAsocArmadoresPuntaDelMoral.porcentaje) / 100,
        };
        servicios.splice(1, 0, servicioExtra);
        return servicios;
    }
    return serviciosAsocArmadoresPuntaDelMoral
        .filter((s) => ASOC_SERVICIOS_SIN_REPERCUSION_T4.has(s.descripcion))
        .map((servicio) => ({
            ...servicio,
            unidades: 1,
            base,
            precio: (base * servicio.porcentaje) / 100,
            importe: (base * servicio.porcentaje) / 100,
        }));
}
