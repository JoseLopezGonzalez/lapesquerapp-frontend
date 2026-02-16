/**
 * Unit tests for DocumentProcessor
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { processDocument, getAzureDocumentType, isValidDocumentType, getAvailableDocumentTypes } from '@/components/Admin/MarketDataExtractor/shared/DocumentProcessor';

vi.mock('@/services/azure', () => ({
    extractDataWithAzureDocumentAi: vi.fn()
}));

import { extractDataWithAzureDocumentAi } from '@/services/azure';

describe('DocumentProcessor', () => {
    describe('getAzureDocumentType', () => {
        it('returns correct Azure type for albaranCofradia', () => {
            expect(getAzureDocumentType('albaranCofradiaPescadoresSantoCristoDelMar')).toBe('AlbaranCofradiaPescadoresSantoCristoDelMar');
        });
        it('returns correct Azure type for lonjaDeIsla', () => {
            expect(getAzureDocumentType('listadoComprasLonjaDeIsla')).toBe('ListadoComprasLonjaDeIsla');
        });
        it('returns correct Azure type for asoc', () => {
            expect(getAzureDocumentType('listadoComprasAsocArmadoresPuntaDelMoral')).toBe('ListadoComprasAsocArmadoresPuntaDelMoral');
        });
        it('throws for invalid type', () => {
            expect(() => getAzureDocumentType('invalidType')).toThrow('Tipo de documento no válido');
        });
    });

    describe('isValidDocumentType', () => {
        it('returns true for valid types', () => {
            expect(isValidDocumentType('albaranCofradiaPescadoresSantoCristoDelMar')).toBe(true);
            expect(isValidDocumentType('listadoComprasLonjaDeIsla')).toBe(true);
            expect(isValidDocumentType('listadoComprasAsocArmadoresPuntaDelMoral')).toBe(true);
        });
        it('returns false for invalid types', () => {
            expect(isValidDocumentType('invalid')).toBe(false);
            expect(isValidDocumentType('')).toBe(false);
        });
    });

    describe('getAvailableDocumentTypes', () => {
        it('returns array of 3 document types', () => {
            const types = getAvailableDocumentTypes();
            expect(Array.isArray(types)).toBe(true);
            expect(types).toHaveLength(3);
            expect(types).toContain('albaranCofradiaPescadoresSantoCristoDelMar');
            expect(types).toContain('listadoComprasLonjaDeIsla');
            expect(types).toContain('listadoComprasAsocArmadoresPuntaDelMoral');
        });
    });

    describe('processDocument', () => {
        const mockFile = { name: 'test.pdf' };

        beforeEach(() => {
            vi.clearAllMocks();
        });

        it('returns success with parsed data when Azure and validation succeed', async () => {
            const mockAzureData = [
                {
                    details: { lonja: 'Lonja', fecha: '2024-01-15' },
                    tables: {
                        ventas: [{ venta: '1', barco: 'B1', codBarco: '001', cajas: '1', especie: 'Atún', kilos: '100', precio: '5', importe: '500' }]
                    }
                }
            ];

            extractDataWithAzureDocumentAi.mockResolvedValue(mockAzureData);

            const result = await processDocument(mockFile, 'listadoComprasLonjaDeIsla');

            expect(extractDataWithAzureDocumentAi).toHaveBeenCalledWith({
                file: mockFile,
                documentType: 'ListadoComprasLonjaDeIsla'
            });
            expect(result.success).toBe(true);
            expect(result.documentType).toBe('listadoComprasLonjaDeIsla');
            expect(result.fileName).toBe('test.pdf');
            expect(result.data).toHaveLength(1);
            expect(result.data[0]).toHaveProperty('details');
            expect(result.data[0]).toHaveProperty('tables');
        });

        it('throws for invalid document type', async () => {
            await expect(processDocument(mockFile, 'invalidType')).rejects.toThrow('Tipo de documento no válido');
            expect(extractDataWithAzureDocumentAi).not.toHaveBeenCalled();
        });
    });
});
