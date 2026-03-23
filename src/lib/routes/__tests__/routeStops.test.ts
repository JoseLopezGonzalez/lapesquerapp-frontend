import { describe, expect, it } from 'vitest';
import {
  buildStopsCoordinateSignature,
  createDraftStop,
  normalizeStops,
  normalizeRouteStop,
  reorderStops,
  serializeStopsForWrite,
} from '@/lib/routes/routeStops';

describe('routeStops', () => {
  it('normalizes stop positions and fallback values', () => {
    const stops = normalizeStops([{ id: 1, label: 'A' }, { id: 2, label: 'B', position: 9 }]);

    expect(stops[0]).toMatchObject({ id: 1, position: 1, status: 'pending', targetType: 'location' });
    expect(stops[1]).toMatchObject({ id: 2, position: 9, status: 'pending' });
  });

  it('keeps stable identities for draft stops and deterministic fallback ids', () => {
    const draftStop = createDraftStop({ label: 'Draft stop', position: 1 });
    const normalizedDraftStop = normalizeRouteStop(draftStop, 0);
    const deterministicStop = normalizeRouteStop({ label: 'Sin id', address: 'Puerto', position: 2 }, 1);
    const deterministicStopAgain = normalizeRouteStop({ label: 'Sin id', address: 'Puerto', position: 2 }, 1);

    expect(normalizedDraftStop.id).toBe(draftStop.id);
    expect(normalizedDraftStop.draftKey).toBe(draftStop.draftKey);
    expect(deterministicStop.id).toBe(deterministicStopAgain.id);
  });

  it('reorders stops and rewrites positions sequentially', () => {
    const reordered = reorderStops(
      normalizeStops([{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }, { id: 'c', label: 'C' }]),
      'a',
      'c'
    );

    expect(reordered.map((stop) => stop.id)).toEqual(['b', 'c', 'a']);
    expect(reordered.map((stop) => stop.position)).toEqual([1, 2, 3]);
  });

  it('serializes stops for backend write payloads', () => {
    const payload = serializeStopsForWrite([
      { id: 1, targetType: 'customer', customerId: 7, label: 'Cliente', notes: '' },
      { id: 2, targetType: 'prospect', prospectId: 9, label: 'Prospecto' },
    ]);

    expect(payload).toEqual([
      expect.objectContaining({ position: 1, customerId: 7, prospectId: undefined, notes: undefined }),
      expect.objectContaining({ position: 2, customerId: undefined, prospectId: 9 }),
    ]);
  });

  it('changes coordinate signature only when coordinates change', () => {
    const base = buildStopsCoordinateSignature([{ id: 1, label: 'A', lat: 1, lng: 2, notes: 'x' }]);
    const sameCoordinates = buildStopsCoordinateSignature([{ id: 1, label: 'B', lat: 1, lng: 2, notes: 'y', status: 'completed' }]);
    const differentCoordinates = buildStopsCoordinateSignature([{ id: 1, label: 'B', lat: 3, lng: 4 }]);

    expect(sameCoordinates).toBe(base);
    expect(differentCoordinates).not.toBe(base);
  });
});
