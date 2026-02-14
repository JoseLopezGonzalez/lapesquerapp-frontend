/**
 * Unit tests for reception calculations
 * Tests pure functions for calculating reception values
 */
import { 
    calculateNetWeight, 
    calculateNetWeights, 
    normalizeDate, 
    isValidDate 
} from '@/helpers/receptionCalculations';

describe('receptionCalculations', () => {
    describe('calculateNetWeight', () => {
        test('calculates net weight correctly', () => {
            expect(calculateNetWeight(100, 5, 2)).toBe(90); // 100 - (2 * 5) = 90
            expect(calculateNetWeight(50, 3, 1)).toBe(47); // 50 - (1 * 3) = 47
        });

        test('handles string inputs', () => {
            expect(calculateNetWeight('100', '5', '2')).toBe(90);
        });

        test('returns 0 for negative results', () => {
            expect(calculateNetWeight(5, 10, 1)).toBe(0); // 5 - (1 * 10) = -5, but returns 0
        });

        test('handles missing values', () => {
            expect(calculateNetWeight(null, 5, 2)).toBe(0);
            expect(calculateNetWeight(100, null, 2)).toBe(98); // defaults to 1 box
            expect(calculateNetWeight(100, 5, null)).toBe(100); // defaults to 0 tare
        });
    });

    describe('calculateNetWeights', () => {
        test('calculates net weights for multiple details', () => {
            const details = [
                { grossWeight: 100, boxes: 5, tare: 2 },
                { grossWeight: 50, boxes: 3, tare: 1 },
            ];
            const result = calculateNetWeights(details);
            expect(result).toEqual([90, 47]);
        });

        test('handles empty array', () => {
            expect(calculateNetWeights([])).toEqual([]);
        });

        test('handles invalid details', () => {
            const details = [
                { grossWeight: null, boxes: 5, tare: 2 },
                { grossWeight: 50, boxes: null, tare: 1 },
            ];
            const result = calculateNetWeights(details);
            expect(result[0]).toBe(0); // grossWeight null → 0
            expect(result[1]).toBe(49); // boxes null → defaults to 1, 50 - (1*1) = 49
        });
    });

    describe('normalizeDate', () => {
        test('normalizes date to 12:00:00', () => {
            const date = new Date('2024-01-15T08:30:00');
            const normalized = normalizeDate(date);
            expect(normalized.getHours()).toBe(12);
            expect(normalized.getMinutes()).toBe(0);
            expect(normalized.getSeconds()).toBe(0);
        });

        test('handles null/undefined', () => {
            const normalized = normalizeDate(null);
            expect(normalized).toBeInstanceOf(Date);
            expect(normalized.getHours()).toBe(12);
        });

        test('handles string dates', () => {
            const normalized = normalizeDate('2024-01-15');
            expect(normalized).toBeInstanceOf(Date);
            expect(normalized.getHours()).toBe(12);
        });

        test('handles invalid dates', () => {
            const normalized = normalizeDate('invalid-date');
            expect(normalized).toBeInstanceOf(Date);
            expect(normalized.getHours()).toBe(12);
        });
    });

    describe('isValidDate', () => {
        test('validates valid dates', () => {
            expect(isValidDate(new Date())).toBe(true);
            expect(isValidDate('2024-01-15')).toBe(true);
        });

        test('rejects invalid dates', () => {
            expect(isValidDate(null)).toBe(false);
            expect(isValidDate(undefined)).toBe(false);
            expect(isValidDate('invalid')).toBe(false);
        });
    });
});

