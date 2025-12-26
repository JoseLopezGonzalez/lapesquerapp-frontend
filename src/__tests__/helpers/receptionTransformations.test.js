/**
 * Unit tests for reception transformations
 * Tests pure functions for transforming reception data
 */
import {
    createPriceKey,
    buildPriceKeyToPalletsMap,
    extractGlobalPriceMap,
    transformPalletsToApiFormat,
    transformDetailsToApiFormat,
    buildProductLotSummary,
} from '@/helpers/receptionTransformations';

describe('receptionTransformations', () => {
    describe('createPriceKey', () => {
        test('creates price key correctly', () => {
            expect(createPriceKey(1, 'LOT001')).toBe('1-LOT001');
            expect(createPriceKey(5, '')).toBe('5-');
            expect(createPriceKey(10, null)).toBe('10-');
            expect(createPriceKey(10, undefined)).toBe('10-');
        });
    });

    describe('buildPriceKeyToPalletsMap', () => {
        test('builds map correctly', () => {
            const temporalPallets = [
                {
                    pallet: {
                        boxes: [
                            { product: { id: 1 }, lot: 'LOT001' },
                            { product: { id: 2 }, lot: 'LOT002' },
                        ],
                    },
                },
                {
                    pallet: {
                        boxes: [
                            { product: { id: 1 }, lot: 'LOT001' },
                        ],
                    },
                },
            ];

            const map = buildPriceKeyToPalletsMap(temporalPallets);
            expect(map.get('1-LOT001')).toEqual([0, 1]);
            expect(map.get('2-LOT002')).toEqual([0]);
        });

        test('handles empty array', () => {
            const map = buildPriceKeyToPalletsMap([]);
            expect(map.size).toBe(0);
        });
    });

    describe('transformDetailsToApiFormat', () => {
        test('transforms details correctly', () => {
            const details = [
                { product: '1', netWeight: '100.5', price: '2.5', lot: 'LOT001', boxes: 5 },
                { product: '2', netWeight: '50.25', price: '', lot: '', boxes: 3 },
            ];

            const result = transformDetailsToApiFormat(details);
            expect(result).toHaveLength(2);
            expect(result[0]).toEqual({
                product: { id: 1 },
                netWeight: 100.5,
                price: 2.5,
                lot: 'LOT001',
                boxes: 5,
            });
            expect(result[1].price).toBeUndefined();
            expect(result[1].lot).toBeUndefined();
        });

        test('filters invalid details', () => {
            const details = [
                { product: '1', netWeight: '0', price: '2.5' },
                { product: null, netWeight: '50', price: '1.5' },
                { product: '2', netWeight: '', price: '1.5' },
            ];

            const result = transformDetailsToApiFormat(details);
            expect(result).toHaveLength(0);
        });
    });

    describe('buildProductLotSummary', () => {
        test('builds summary correctly', () => {
            const pallet = {
                boxes: [
                    { product: { id: 1, name: 'Product 1' }, lot: 'LOT001', netWeight: '10.5' },
                    { product: { id: 1, name: 'Product 1' }, lot: 'LOT001', netWeight: '5.5' },
                    { product: { id: 2, name: 'Product 2' }, lot: 'LOT002', netWeight: '20' },
                ],
            };

            const result = buildProductLotSummary(pallet);
            expect(result).toHaveLength(2);
            expect(result[0]).toMatchObject({
                productId: 1,
                productName: 'Product 1',
                lot: 'LOT001',
                boxesCount: 2,
                totalNetWeight: 16,
            });
        });

        test('handles empty pallet', () => {
            const result = buildProductLotSummary({ boxes: [] });
            expect(result).toEqual([]);
        });
    });
});

