import { describe, it, expect } from 'vitest';
import { findBarcoMatch, parseBoatName } from '@/exportHelpers/lonjaDeIslaBarcoMatcher';

const CATALOG = [
    { cod: '325', barco: 'JOSE PRIN', codVendiduria: 'CF' },
    { cod: '343', barco: 'PESCAITO GABRIEL Y MANUEL', codVendiduria: 'JA' },
    { cod: '390', barco: 'HNOS PEREZ MUNELL', codVendiduria: 'PI' },
    { barco: 'EL JUNZA', codVendiduria: 'CF' },
    { barco: 'NAVEGA', codVendiduria: 'PI' },
    { barco: 'MADRIGAL FERRERA', codVendiduria: 'EX' },
    { barco: 'Mª  CARMEN Y ANDREA', codVendiduria: 'CF' },
    { barco: 'VICTORIA DE ANTONIO EL MORO', codVendiduria: 'PI' },
];

describe('parseBoatName', () => {
    it('strips CF- prefix', () => {
        const result = parseBoatName('CF-JOSE PRIN');
        expect(result.prefix).toBe('CF');
        expect(result.codVendiduria).toBe('CF');
        expect(result.name).toBe('JOSE PRIN');
    });

    it('strips PI- prefix', () => {
        const result = parseBoatName('PI-NAVEGA');
        expect(result.prefix).toBe('PI');
        expect(result.codVendiduria).toBe('PI');
        expect(result.name).toBe('NAVEGA');
    });

    it('strips EX- prefix', () => {
        const result = parseBoatName('EX-MADRIGAL FERRERA');
        expect(result.prefix).toBe('EX');
        expect(result.codVendiduria).toBe('EX');
        expect(result.name).toBe('MADRIGAL FERRERA');
    });

    it('strips JA- prefix', () => {
        const result = parseBoatName('JA-PESCAITO GABRIEL');
        expect(result.prefix).toBe('JA');
        expect(result.codVendiduria).toBe('JA');
        expect(result.name).toBe('PESCAITO GABRIEL');
    });

    it('handles prefix with spaces around dash', () => {
        const result = parseBoatName('CF - JOSE PRIN');
        expect(result.prefix).toBe('CF');
        expect(result.name).toBe('JOSE PRIN');
    });

    it('handles prefix case-insensitively', () => {
        const result = parseBoatName('cf-JOSE PRIN');
        expect(result.prefix).toBe('CF');
        expect(result.name).toBe('JOSE PRIN');
    });

    it('returns null prefix when no known prefix', () => {
        const result = parseBoatName('EL JUNZA');
        expect(result.prefix).toBeNull();
        expect(result.codVendiduria).toBeNull();
        expect(result.name).toBe('EL JUNZA');
    });

    it('handles null/undefined input', () => {
        expect(parseBoatName(null).name).toBe('');
        expect(parseBoatName(undefined).name).toBe('');
    });
});

describe('findBarcoMatch', () => {
    describe('tier 1: exact cod match', () => {
        it('matches by cod when available', () => {
            const result = findBarcoMatch(CATALOG, { codBarco: '325', barco: 'WHATEVER' });
            expect(result).not.toBeNull();
            expect(result.barco).toBe('JOSE PRIN');
        });

        it('prioritizes cod over name', () => {
            const result = findBarcoMatch(CATALOG, { codBarco: '325', barco: 'EL JUNZA' });
            expect(result.barco).toBe('JOSE PRIN');
        });
    });

    describe('tier 2: exact normalized name match', () => {
        it('matches case-insensitively', () => {
            const result = findBarcoMatch(CATALOG, { barco: 'el junza' });
            expect(result).not.toBeNull();
            expect(result.barco).toBe('EL JUNZA');
        });

        it('matches ignoring accents', () => {
            const result = findBarcoMatch(CATALOG, { barco: 'NAVEGÁ' });
            expect(result).not.toBeNull();
            expect(result.barco).toBe('NAVEGA');
        });

        it('matches after stripping vendiduria prefix', () => {
            const result = findBarcoMatch(CATALOG, { barco: 'CF-JOSE PRIN' });
            expect(result).not.toBeNull();
            expect(result.barco).toBe('JOSE PRIN');
        });

        it('matches PI- prefix', () => {
            const result = findBarcoMatch(CATALOG, { barco: 'PI-NAVEGA' });
            expect(result).not.toBeNull();
            expect(result.barco).toBe('NAVEGA');
        });

        it('matches EX- prefix', () => {
            const result = findBarcoMatch(CATALOG, { barco: 'EX-MADRIGAL FERRERA' });
            expect(result).not.toBeNull();
            expect(result.barco).toBe('MADRIGAL FERRERA');
        });
    });

    describe('cod guarantee', () => {
        it('uses venta.codBarco as cod when catalog entry has none', () => {
            const result = findBarcoMatch(CATALOG, { codBarco: '674', barco: 'EL JUNZA' });
            expect(result).not.toBeNull();
            expect(result.cod).toBe('674');
            expect(result.barco).toBe('EL JUNZA');
        });

        it('falls back to cleaned name as cod when both catalog and venta lack cod', () => {
            const result = findBarcoMatch(CATALOG, { barco: 'EL JUNZA' });
            expect(result).not.toBeNull();
            expect(result.cod).toBe('EL JUNZA');
        });

        it('preserves catalog cod when it exists', () => {
            const result = findBarcoMatch(CATALOG, { codBarco: '999', barco: 'JOSE PRIN' });
            expect(result.cod).toBe('325');
        });

        it('fills cod from codBarco with prefix stripping and same vendiduria', () => {
            const result = findBarcoMatch(CATALOG, { codBarco: '917', barco: 'EX-MADRIGAL FERRERA' });
            expect(result).not.toBeNull();
            expect(result.cod).toBe('917');
            expect(result.codVendiduria).toBe('EX');
        });

        it('fills cod from codBarco with prefix override to different vendiduria', () => {
            const result = findBarcoMatch(CATALOG, { codBarco: '888', barco: 'JA-NAVEGA' });
            expect(result).not.toBeNull();
            expect(result.cod).toBe('888');
            expect(result.codVendiduria).toBe('JA');
            expect(result._prefixOverride).toBe(true);
        });
    });

    describe('tier 3: partial name match (truncated names)', () => {
        it('matches when doc name is a prefix of catalog name', () => {
            const result = findBarcoMatch(CATALOG, { barco: 'HNOS PEREZ MU' });
            expect(result).not.toBeNull();
            expect(result.barco).toBe('HNOS PEREZ MUNELL');
        });

        it('matches truncated name with vendiduria prefix', () => {
            const result = findBarcoMatch(CATALOG, { barco: 'CF-JOSE PRI' });
            expect(result).not.toBeNull();
            expect(result.barco).toBe('JOSE PRIN');
        });

        it('matches when catalog name is a prefix of doc name', () => {
            const result = findBarcoMatch(CATALOG, { barco: 'NAVEGA DOS' });
            expect(result).not.toBeNull();
            expect(result.barco).toBe('NAVEGA');
        });

        it('matches truncated name with accent differences', () => {
            const result = findBarcoMatch(CATALOG, { barco: 'PI-VICTORIA DE ANTONIO' });
            expect(result).not.toBeNull();
            expect(result.barco).toBe('VICTORIA DE ANTONIO EL MORO');
        });
    });

    describe('prefix override (scenario 2)', () => {
        it('overrides codVendiduria when prefix differs from catalog', () => {
            const result = findBarcoMatch(CATALOG, { barco: 'PI-JOSE PRIN' });
            expect(result).not.toBeNull();
            expect(result.barco).toBe('JOSE PRIN');
            expect(result.codVendiduria).toBe('PI');
            expect(result._originalCodVendiduria).toBe('CF');
            expect(result._prefixOverride).toBe(true);
        });

        it('does not override when prefix matches catalog', () => {
            const result = findBarcoMatch(CATALOG, { barco: 'CF-JOSE PRIN' });
            expect(result).not.toBeNull();
            expect(result.codVendiduria).toBe('CF');
            expect(result._prefixOverride).toBeUndefined();
        });

        it('overrides even on cod match when prefix differs', () => {
            const result = findBarcoMatch(CATALOG, { codBarco: '325', barco: 'EX-JOSE PRIN' });
            expect(result.barco).toBe('JOSE PRIN');
            expect(result.codVendiduria).toBe('EX');
            expect(result._originalCodVendiduria).toBe('CF');
        });
    });

    describe('virtual match with prefix (scenario 3)', () => {
        it('creates virtual entry when no catalog match but has prefix', () => {
            const result = findBarcoMatch(CATALOG, { barco: 'CF-BARCO NUEVO DESCONOCIDO' });
            expect(result).not.toBeNull();
            expect(result.barco).toBe('BARCO NUEVO DESCONOCIDO');
            expect(result.codVendiduria).toBe('CF');
            expect(result._virtual).toBe(true);
        });

        it('uses codBarco as cod for virtual entry when available', () => {
            const result = findBarcoMatch(CATALOG, { codBarco: '999', barco: 'PI-BARCO NUEVO' });
            expect(result).not.toBeNull();
            expect(result.cod).toBe('999');
            expect(result.codVendiduria).toBe('PI');
            expect(result._virtual).toBe(true);
        });

        it('uses cleaned name as cod when codBarco is absent', () => {
            const result = findBarcoMatch(CATALOG, { barco: 'JA-MI BARCO RARO' });
            expect(result).not.toBeNull();
            expect(result.cod).toBe('MI BARCO RARO');
            expect(result.codVendiduria).toBe('JA');
            expect(result._virtual).toBe(true);
        });
    });

    describe('no match and no prefix (scenario 4)', () => {
        it('returns null when no match and no prefix', () => {
            const result = findBarcoMatch(CATALOG, { barco: 'BARCO DESCONOCIDO' });
            expect(result).toBeNull();
        });

        it('returns null for null venta', () => {
            expect(findBarcoMatch(CATALOG, null)).toBeNull();
        });

        it('returns null for empty barco', () => {
            expect(findBarcoMatch(CATALOG, { barco: '' })).toBeNull();
        });
    });
});
