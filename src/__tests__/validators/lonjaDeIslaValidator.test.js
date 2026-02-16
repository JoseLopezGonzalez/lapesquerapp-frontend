/**
 * Unit tests for lonjaDeIslaValidator
 */
import { describe, it, expect } from 'vitest';
import { validateLonjaDeIslaStructure } from '@/validators/lonjas/lonjaDeIslaValidator';
import { ValidationError } from '@/errors/lonjasErrors';

describe('validateLonjaDeIslaStructure', () => {
    const validDocument = {
        details: {
            lonja: 'Lonja de Isla',
            fecha: '2024-01-15',
            cifComprador: 'B12345678',
            comprador: 'Test Comprador',
            numeroComprador: '001',
            importeTotal: '1000,50'
        },
        tables: {
            ventas: [
                {
                    venta: '1',
                    barco: 'Barco 1',
                    codBarco: '001',
                    cajas: '10',
                    especie: 'Atún',
                    kilos: '100',
                    precio: '5,50',
                    importe: '550'
                }
            ],
            peces: [
                { fao: 'TU', descripcion: 'Atún', kilos: '100', importe: '550' }
            ],
            vendidurias: [
                { vendiduria: 'Vend 1', cajas: '10', kilos: '100', importe: '550' }
            ],
            cajas: [
                { descripcion: 'Caja 5kg', cajas: '20', importe: '100' }
            ],
            tipoVentas: [
                { descripcion: 'Subasta', cajas: '10', importe: '550' }
            ]
        }
    };

    it('accepts valid structure', () => {
        expect(() => validateLonjaDeIslaStructure([validDocument])).not.toThrow();
    });

    it('accepts multiple valid documents', () => {
        expect(() => validateLonjaDeIslaStructure([validDocument, validDocument])).not.toThrow();
    });

    it('throws ValidationError for empty array', () => {
        expect(() => validateLonjaDeIslaStructure([])).toThrow(ValidationError);
        expect(() => validateLonjaDeIslaStructure([])).toThrow('array de documentos');
    });

    it('throws ValidationError for null/undefined', () => {
        expect(() => validateLonjaDeIslaStructure(null)).toThrow(ValidationError);
        expect(() => validateLonjaDeIslaStructure(undefined)).toThrow(ValidationError);
    });

    it('throws ValidationError for non-array', () => {
        expect(() => validateLonjaDeIslaStructure({})).toThrow(ValidationError);
        expect(() => validateLonjaDeIslaStructure('invalid')).toThrow(ValidationError);
    });

    it('throws ValidationError when details.lonja is missing', () => {
        const invalid = JSON.parse(JSON.stringify(validDocument));
        delete invalid.details.lonja;
        expect(() => validateLonjaDeIslaStructure([invalid])).toThrow(ValidationError);
        expect(() => validateLonjaDeIslaStructure([invalid])).toThrow(/lonja/i);
    });

    it('throws ValidationError when details.fecha is missing', () => {
        const invalid = JSON.parse(JSON.stringify(validDocument));
        delete invalid.details.fecha;
        expect(() => validateLonjaDeIslaStructure([invalid])).toThrow(ValidationError);
    });

    it('throws ValidationError when tables.ventas is empty', () => {
        const invalid = JSON.parse(JSON.stringify(validDocument));
        invalid.tables.ventas = [];
        expect(() => validateLonjaDeIslaStructure([invalid])).toThrow(ValidationError);
    });

    it('throws ValidationError when venta row missing required field', () => {
        const invalid = JSON.parse(JSON.stringify(validDocument));
        delete invalid.tables.ventas[0].barco;
        expect(() => validateLonjaDeIslaStructure([invalid])).toThrow(ValidationError);
    });
});
