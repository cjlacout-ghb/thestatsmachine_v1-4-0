import { describe, it, expect } from 'vitest';
import { formatLocalDate, getMonthStr, getDayStr } from '../dateUtils';

describe('formatLocalDate', () => {
    it('formats a valid date string without timezone shift', () => {
        // '2024-07-04' should display as "Jul 4" regardless of timezone
        const result = formatLocalDate('2024-07-04');
        expect(result).toBe('Jul 4');
    });

    it('handles a January 1st date correctly', () => {
        const result = formatLocalDate('2024-01-01');
        expect(result).toBe('Jan 1');
    });

    it('returns empty string for empty input', () => {
        expect(formatLocalDate('')).toBe('');
    });

    it('accepts custom format options', () => {
        const result = formatLocalDate('2024-07-04', { year: 'numeric', month: 'long', day: 'numeric' });
        expect(result).toContain('2024');
        expect(result).toContain('July');
        expect(result).toContain('4');
    });
});

describe('getMonthStr', () => {
    it('returns uppercase month abbreviation', () => {
        expect(getMonthStr('2024-07-04')).toBe('JUL');
        expect(getMonthStr('2024-01-15')).toBe('JAN');
        expect(getMonthStr('2024-12-25')).toBe('DEC');
    });
});

describe('getDayStr', () => {
    it('returns numeric day string', () => {
        expect(getDayStr('2024-07-04')).toBe('4');
        expect(getDayStr('2024-01-15')).toBe('15');
    });
});
