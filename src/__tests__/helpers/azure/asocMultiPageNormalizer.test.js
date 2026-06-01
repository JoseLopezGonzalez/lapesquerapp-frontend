import { describe, it, expect } from 'vitest';
import { normalizeAsocMultiPage } from '@/helpers/azure/asocMultiPageNormalizer';

function makeSubasta(overrides = {}) {
  return {
    venta: '100',
    especie: 'GAMBAS',
    fao: 'GAM',
    nombreCientifico: 'GAMBUS',
    calibre: 'M',
    envase: 'CAJA',
    cajas: '2',
    pesoNeto: '15.5',
    artePesca: 'ARRASTRE',
    metodoProduccion: 'CAPTURA',
    lote: 'L-1',
    zonaCaptura: '27',
    precio: '8.00',
    importe: '124.00',
    barco: 'BARCO A',
    matricula: 'HU-1',
    ...overrides,
  };
}

function makeDoc({ subastas = [] } = {}) {
  return {
    details: {
      lonja: 'ASOC ARMADORES',
      fecha: '2025-02-10',
      tipoSubasta: 'M1 M1',
      comprador: 'TEST',
      cifComprador: 'B00',
      importeTotal: '1000',
    },
    tables: { subastas },
    objects: {},
  };
}

describe('normalizeAsocMultiPage', () => {
  it('returns single-page doc unchanged when there are no merged rows', () => {
    const s1 = makeSubasta({ venta: '100' });
    const s2 = makeSubasta({ venta: '101', especie: 'PULPO' });
    const doc = makeDoc({ subastas: [s1, s2] });

    const result = normalizeAsocMultiPage([doc]);

    expect(result).toHaveLength(1);
    expect(result[0].tables.subastas).toHaveLength(2);
    expect(result[0].tables.subastas[0]).toEqual(s1);
    expect(result[0].tables.subastas[1]).toEqual(s2);
  });

  it('splits newline-concatenated subasta rows', () => {
    const merged = makeSubasta({
      especie: 'GAMBAS\nPULPO',
      cajas: '2\n3',
      pesoNeto: '15.5\n20.0',
      precio: '8.00\n9.00',
      importe: '124.00\n180.00',
      barco: 'BARCO A\nBARCO B',
      matricula: 'HU-1\nHU-2',
    });

    const result = normalizeAsocMultiPage([makeDoc({ subastas: [merged] })]);

    expect(result[0].tables.subastas).toHaveLength(2);
    expect(result[0].tables.subastas[0].especie).toBe('GAMBAS');
    expect(result[0].tables.subastas[1].especie).toBe('PULPO');
    expect(result[0].tables.subastas[1].matricula).toBe('HU-2');
  });

  it('merges multiple page documents into one', () => {
    const doc1 = makeDoc({ subastas: [makeSubasta({ venta: '100' })] });
    const doc2 = makeDoc({ subastas: [makeSubasta({ venta: '200', especie: 'CIGALAS' })] });

    const result = normalizeAsocMultiPage([doc1, doc2]);

    expect(result).toHaveLength(1);
    expect(result[0].tables.subastas).toHaveLength(2);
    expect(result[0].tables.subastas[0].venta).toBe('100');
    expect(result[0].tables.subastas[1].venta).toBe('200');
  });
});
