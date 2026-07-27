import { describe, it, expect } from 'vitest';
import { calculateSourcesAllocation } from '@/helpers/production/sourcesAllocation';

function stockInput(productId: number, productName: string, netWeight: number) {
  return { box: { product: { id: productId, name: productName }, netWeight } };
}

function parentConsumption(id: number, productName: string, consumedWeightKg: number) {
  return {
    id,
    consumedWeightKg,
    productionOutput: { product: { name: productName } },
  };
}

function stockSource(productId: number, contributedWeightKg: number) {
  return { sourceType: 'stock_product', productId, contributedWeightKg };
}

function parentSource(productionOutputConsumptionId: number, contributedWeightKg: number) {
  return { sourceType: 'parent_output', productionOutputConsumptionId, contributedWeightKg };
}

function output(sources: unknown[]) {
  return { sources };
}

describe('calculateSourcesAllocation', () => {
  it('marca como ok una fuente de stock repartida al 100%', () => {
    const result = calculateSourcesAllocation(
      [stockInput(1, 'Merluza', 100)],
      [],
      [output([stockSource(1, 100)])]
    );

    expect(result.hasIssues).toBe(false);
    expect(result.worstSeverity).toBe('none');
    expect(result.sources[0].status).toBe('ok');
  });

  it('tolera un pequeño resto por redondeo (99.5%) sin marcar aviso', () => {
    const result = calculateSourcesAllocation(
      [stockInput(1, 'Merluza', 200)],
      [],
      [output([stockSource(1, 199)])]
    );

    expect(result.hasIssues).toBe(false);
    expect(result.sources[0].status).toBe('ok');
  });

  it('marca "warning" cuando falta repartir entre 1% y 5%', () => {
    const result = calculateSourcesAllocation(
      [stockInput(1, 'Merluza', 100)],
      [],
      [output([stockSource(1, 97)])]
    );

    expect(result.hasIssues).toBe(true);
    expect(result.worstSeverity).toBe('warning');
    expect(result.sources[0].status).toBe('under_allocated');
    expect(result.sources[0].gapWeight).toBeCloseTo(3, 2);
  });

  it('marca "critical" cuando falta repartir más del 5%', () => {
    const result = calculateSourcesAllocation(
      [stockInput(1, 'Merluza', 100)],
      [],
      [output([stockSource(1, 80)])]
    );

    expect(result.hasIssues).toBe(true);
    expect(result.worstSeverity).toBe('critical');
    expect(result.sources[0].status).toBe('under_allocated');
  });

  it('marca "critical" con status over_allocated cuando se asigna más de lo disponible', () => {
    const result = calculateSourcesAllocation(
      [stockInput(1, 'Merluza', 100)],
      [],
      [output([stockSource(1, 60)]), output([stockSource(1, 60)])]
    );

    expect(result.hasIssues).toBe(true);
    expect(result.worstSeverity).toBe('critical');
    expect(result.sources[0].status).toBe('over_allocated');
    expect(result.sources[0].gapWeight).toBeLessThan(0);
  });

  it('agrupa consumos del proceso padre como fuentes independientes por id', () => {
    const result = calculateSourcesAllocation(
      [],
      [parentConsumption(10, 'Bacalao', 50), parentConsumption(11, 'Bacalao', 30)],
      [output([parentSource(10, 50), parentSource(11, 25)])]
    );

    expect(result.sources).toHaveLength(2);
    const consumption10 = result.sources.find((s) => s.productionOutputConsumptionId === 10);
    const consumption11 = result.sources.find((s) => s.productionOutputConsumptionId === 11);
    expect(consumption10?.status).toBe('ok');
    expect(consumption11?.status).toBe('under_allocated');
  });

  it('no genera fuentes cuando no hay inputs ni consumos', () => {
    const result = calculateSourcesAllocation([], [], [output([])]);

    expect(result.sources).toHaveLength(0);
    expect(result.hasIssues).toBe(false);
  });
});
