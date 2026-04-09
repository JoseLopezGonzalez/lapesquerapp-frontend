import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { normalizeLonjaDeIslaMultiPage } from '@/helpers/azure/lonjaDeIslaMultiPageNormalizer';

function makeDoc({ ventas = [], peces = [], vendidurias = [], cajas = [], tipoVentas = [] } = {}) {
    return {
        details: { lonja: 'LONJA DE ISLA CRISTINA', fecha: '2025-02-10', cifComprador: 'B00', comprador: 'TEST', numeroComprador: '1', importeTotal: '1000' },
        tables: { ventas, peces, vendidurias, cajas, tipoVentas },
        objects: {},
    };
}

function makeVenta(overrides = {}) {
    return { venta: '100', barco: 'BARCO A', codBarco: '10', matricula: 'M1', cajas: '2', especie: 'GAMBAS / GAMBA BLANCA', kilos: '15.5', precio: '8.00', importe: '124.00', nrsi: 'N1', ...overrides };
}

describe('normalizeLonjaDeIslaMultiPage', () => {
    let warnSpy;

    beforeEach(() => {
        warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    });
    afterEach(() => {
        warnSpy.mockRestore();
    });

    // ─── Pass-through / no-op ────────────────────────────────────────────

    describe('single-page documents (no-op)', () => {
        it('returns the same data when no rows contain newlines', () => {
            const v1 = makeVenta({ venta: '100' });
            const v2 = makeVenta({ venta: '101', especie: 'CAÑAILLAS / CAÑAILLA', kilos: '10' });
            const doc = makeDoc({ ventas: [v1, v2] });

            const result = normalizeLonjaDeIslaMultiPage([doc]);

            expect(result).toHaveLength(1);
            expect(result[0].tables.ventas).toHaveLength(2);
            expect(result[0].tables.ventas[0]).toEqual(v1);
            expect(result[0].tables.ventas[1]).toEqual(v2);
        });

        it('preserves all details and tables unchanged', () => {
            const peces = [{ fao: 'OCC', descripcion: 'GAMBAS / GAMBA BLANCA', cajas: '2', kilos: '15.5', importe: '124' }];
            const doc = makeDoc({ ventas: [makeVenta()], peces });

            const result = normalizeLonjaDeIslaMultiPage([doc]);

            expect(result[0].details).toEqual(doc.details);
            expect(result[0].tables.peces).toEqual(peces);
        });

        it('returns empty array as-is', () => {
            expect(normalizeLonjaDeIslaMultiPage([])).toEqual([]);
        });

        it('returns null/undefined input as-is', () => {
            expect(normalizeLonjaDeIslaMultiPage(null)).toBeNull();
            expect(normalizeLonjaDeIslaMultiPage(undefined)).toBeUndefined();
        });
    });

    // ─── Row splitting ──────────────────────────────────────────────────

    describe('merged row splitting', () => {
        it('splits a row with newline-separated fields into individual rows', () => {
            const merged = makeVenta({
                venta: '502',
                codBarco: '920\n1052',
                barco: 'BARCO A\nBARCO B',
                especie: 'GAMBAS / GAMBA BLANCA\nCAÑAILLAS / CAÑAILLA',
                cajas: '2\n3',
                kilos: '15.5\n10.0',
                precio: '8.00\n12.00',
                importe: '124.00\n120.00',
            });
            const doc = makeDoc({ ventas: [merged] });

            const result = normalizeLonjaDeIslaMultiPage([doc]);
            const ventas = result[0].tables.ventas;

            expect(ventas).toHaveLength(2);
            expect(ventas[0].codBarco).toBe('920');
            expect(ventas[0].especie).toBe('GAMBAS / GAMBA BLANCA');
            expect(ventas[0].kilos).toBe('15.5');
            expect(ventas[1].codBarco).toBe('1052');
            expect(ventas[1].especie).toBe('CAÑAILLAS / CAÑAILLA');
            expect(ventas[1].kilos).toBe('10.0');
        });

        it('replicates single-value fields across all sub-rows', () => {
            const merged = makeVenta({
                venta: '502',
                nrsi: 'N1',
                codBarco: '920\n1052',
                barco: 'BARCO A\nBARCO B',
                especie: 'GAMBAS / GAMBA BLANCA\nCAÑAILLAS / CAÑAILLA',
                cajas: '2\n3',
                kilos: '15.5\n10.0',
                precio: '8.00\n12.00',
                importe: '124.00\n120.00',
            });
            const doc = makeDoc({ ventas: [merged] });

            const result = normalizeLonjaDeIslaMultiPage([doc]);
            const ventas = result[0].tables.ventas;

            expect(ventas[0].venta).toBe('502');
            expect(ventas[1].venta).toBe('502');
            expect(ventas[0].nrsi).toBe('N1');
            expect(ventas[1].nrsi).toBe('N1');
        });

        it('handles uneven field split counts by padding with empty string', () => {
            const merged = makeVenta({
                codBarco: '920\n1052\n708',
                barco: 'A\nB',
                especie: 'GAMBAS / GAMBA BLANCA\nCAÑAILLAS / CAÑAILLA\nRASCACIOS / ESCORPORA',
                cajas: '2\n3\n1',
                kilos: '15.5\n10.0\n5.0',
                precio: '8.00\n12.00\n6.00',
                importe: '124.00\n120.00\n30.00',
            });
            const doc = makeDoc({ ventas: [merged] });

            const result = normalizeLonjaDeIslaMultiPage([doc]);
            const ventas = result[0].tables.ventas;

            expect(ventas).toHaveLength(3);
            expect(ventas[0].barco).toBe('A');
            expect(ventas[1].barco).toBe('B');
            expect(ventas[2].barco).toBe('');
        });

        it('filters out garbage rows where especie is "/" or empty', () => {
            const merged = makeVenta({
                codBarco: '920\n1052\n',
                especie: 'GAMBAS / GAMBA BLANCA\nCAÑAILLAS / CAÑAILLA\n/',
                kilos: '15.5\n10.0\n',
                precio: '8.00\n12.00\n',
                importe: '124.00\n120.00\n',
                cajas: '2\n3\n',
                barco: 'A\nB\nC',
            });
            const doc = makeDoc({ ventas: [merged] });

            const result = normalizeLonjaDeIslaMultiPage([doc]);
            const ventas = result[0].tables.ventas;

            expect(ventas).toHaveLength(2);
            expect(ventas[0].especie).toBe('GAMBAS / GAMBA BLANCA');
            expect(ventas[1].especie).toBe('CAÑAILLAS / CAÑAILLA');
        });

        it('keeps clean rows alongside split rows', () => {
            const clean1 = makeVenta({ venta: '100', especie: 'PULPO', kilos: '50' });
            const merged = makeVenta({
                venta: '502',
                codBarco: '920\n1052',
                barco: 'A\nB',
                especie: 'GAMBAS / GAMBA BLANCA\nCAÑAILLAS / CAÑAILLA',
                cajas: '2\n3',
                kilos: '15.5\n10.0',
                precio: '8.00\n12.00',
                importe: '124.00\n120.00',
            });
            const clean2 = makeVenta({ venta: '200', especie: 'LENGUADO', kilos: '5' });
            const doc = makeDoc({ ventas: [clean1, merged, clean2] });

            const result = normalizeLonjaDeIslaMultiPage([doc]);
            const ventas = result[0].tables.ventas;

            expect(ventas).toHaveLength(4);
            expect(ventas[0].especie).toBe('PULPO');
            expect(ventas[1].especie).toBe('GAMBAS / GAMBA BLANCA');
            expect(ventas[2].especie).toBe('CAÑAILLAS / CAÑAILLA');
            expect(ventas[3].especie).toBe('LENGUADO');
        });
    });

    // ─── Multi-document merge ───────────────────────────────────────────

    describe('multi-document merge', () => {
        it('merges two Azure documents into one', () => {
            const doc1 = makeDoc({
                ventas: [makeVenta({ venta: '100', especie: 'GAMBAS', kilos: '10' })],
                peces: [{ fao: 'OCC', descripcion: 'GAMBAS', kilos: '10', importe: '80' }],
            });
            const doc2 = makeDoc({
                ventas: [makeVenta({ venta: '200', especie: 'CAÑAILLAS', kilos: '5' })],
                peces: [{ fao: 'MUI', descripcion: 'CAÑAILLAS', kilos: '5', importe: '60' }],
            });

            const result = normalizeLonjaDeIslaMultiPage([doc1, doc2]);

            expect(result).toHaveLength(1);
            expect(result[0].tables.ventas).toHaveLength(2);
            expect(result[0].tables.peces).toHaveLength(2);
            expect(result[0].details.lonja).toBe(doc1.details.lonja);
        });

        it('merges documents and then splits merged rows', () => {
            const doc1 = makeDoc({
                ventas: [makeVenta({ venta: '100', especie: 'GAMBAS', kilos: '10' })],
            });
            const doc2 = makeDoc({
                ventas: [makeVenta({
                    venta: '502',
                    especie: 'CAÑAILLAS / CAÑAILLA\nRASCACIOS / ESCORPORA',
                    kilos: '5\n3',
                    precio: '12\n8',
                    importe: '60\n24',
                    cajas: '1\n1',
                    codBarco: '920\n1052',
                    barco: 'A\nB',
                })],
            });

            const result = normalizeLonjaDeIslaMultiPage([doc1, doc2]);

            expect(result[0].tables.ventas).toHaveLength(3);
            expect(result[0].tables.ventas[0].especie).toBe('GAMBAS');
            expect(result[0].tables.ventas[1].especie).toBe('CAÑAILLAS / CAÑAILLA');
            expect(result[0].tables.ventas[2].especie).toBe('RASCACIOS / ESCORPORA');
        });
    });

    // ─── Cross-validation with peces ────────────────────────────────────

    describe('cross-validation with peces', () => {
        it('logs a warning when ventas totals diverge from peces', () => {
            const doc = makeDoc({
                ventas: [
                    makeVenta({ especie: 'GAMBAS / GAMBA BLANCA', kilos: '10' }),
                    makeVenta({ especie: 'GAMBAS / GAMBA BLANCA', kilos: '5' }),
                ],
                peces: [
                    { fao: 'OCC', descripcion: 'GAMBAS / GAMBA BLANCA', kilos: '20', importe: '160' },
                ],
            });

            normalizeLonjaDeIslaMultiPage([doc]);

            expect(warnSpy).toHaveBeenCalledWith(
                expect.stringContaining('Discrepancia'),
            );
        });

        it('does not warn when totals match', () => {
            const doc = makeDoc({
                ventas: [
                    makeVenta({ especie: 'GAMBAS / GAMBA BLANCA', kilos: '10' }),
                    makeVenta({ especie: 'GAMBAS / GAMBA BLANCA', kilos: '5' }),
                ],
                peces: [
                    { fao: 'OCC', descripcion: 'GAMBAS / GAMBA BLANCA', kilos: '15', importe: '120' },
                ],
            });

            normalizeLonjaDeIslaMultiPage([doc]);

            expect(warnSpy).not.toHaveBeenCalled();
        });

        it('silently skips cross-validation when peces is empty', () => {
            const doc = makeDoc({
                ventas: [makeVenta()],
                peces: [],
            });

            normalizeLonjaDeIslaMultiPage([doc]);

            expect(warnSpy).not.toHaveBeenCalled();
        });
    });
});
