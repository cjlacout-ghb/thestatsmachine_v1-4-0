import { describe, it, expect } from 'vitest';
import { inningsToOuts, outsToInnings, normalizeInnings, isValidInnings } from '../sportsUtils';

describe('inningsToOuts', () => {
    it('converts whole innings correctly', () => {
        expect(inningsToOuts(7.0)).toBe(21);
        expect(inningsToOuts(0)).toBe(0);
        expect(inningsToOuts(1.0)).toBe(3);
    });

    it('converts partial innings correctly', () => {
        expect(inningsToOuts(7.1)).toBe(22);
        expect(inningsToOuts(7.2)).toBe(23);
        expect(inningsToOuts(4.1)).toBe(13);
        expect(inningsToOuts(4.2)).toBe(14);
    });
});

describe('outsToInnings', () => {
    it('converts outs back to innings correctly', () => {
        expect(outsToInnings(21)).toBe(7);
        expect(outsToInnings(22)).toBe(7.1);
        expect(outsToInnings(23)).toBe(7.2);
        expect(outsToInnings(0)).toBe(0);
    });

    it('is the inverse of inningsToOuts for valid values', () => {
        const validInnings = [0, 1.0, 1.1, 1.2, 7.0, 7.1, 7.2, 4.2];
        for (const inn of validInnings) {
            expect(outsToInnings(inningsToOuts(inn))).toBeCloseTo(inn, 5);
        }
    });
});

describe('normalizeInnings', () => {
    it('passes valid innings unchanged', () => {
        expect(normalizeInnings(7.0)).toBe(7.0);
        expect(normalizeInnings(7.1)).toBe(7.1);
        expect(normalizeInnings(7.2)).toBe(7.2);
    });

    it('normalizes overflow from .3 to the next inning', () => {
        // 5.3 outs = 18 outs = 6.0 innings
        expect(normalizeInnings(5.3)).toBeCloseTo(6.0, 5);
    });

    it('handles zero', () => {
        expect(normalizeInnings(0)).toBe(0);
    });
});

describe('isValidInnings', () => {
    it('accepts valid innings notation', () => {
        expect(isValidInnings(7.0)).toBe(true);
        expect(isValidInnings(7.1)).toBe(true);
        expect(isValidInnings(7.2)).toBe(true);
        expect(isValidInnings(0)).toBe(true);
    });

    it('rejects .3 fractions', () => {
        expect(isValidInnings(5.3)).toBe(false);
    });
});
