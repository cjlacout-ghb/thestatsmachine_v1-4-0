import { describe, it, expect } from 'vitest';
import {
    calcBatting,
    calcPitching,
    calcFielding,
    parseIP,
    formatIP,
    formatAvg,
    formatERA,
    formatWHIP,
    getAvgLevel,
    getERALevel,
    getFldLevel,
} from '../calculations';
import type { PlayerGameStats } from '../../types';

// ── Test helpers ─────────────────────────────────────────────────────────────

function makeStats(overrides: Partial<PlayerGameStats> = {}): PlayerGameStats {
    return {
        playerId: 'p1',
        ab: 0, h: 0, doubles: 0, triples: 0, hr: 0,
        rbi: 0, r: 0, bb: 0, so: 0, hbp: 0, sb: 0, cs: 0, sac: 0, sf: 0,
        ip: 0, pH: 0, pR: 0, er: 0, pBB: 0, pSO: 0, pHR: 0, pitchCount: 0,
        po: 0, a: 0, e: 0,
        ...overrides,
    };
}

// ── calcBatting ───────────────────────────────────────────────────────────────

describe('calcBatting', () => {
    it('calculates batting average correctly', () => {
        const stats = makeStats({ ab: 4, h: 2 });
        const result = calcBatting(stats);
        expect(result.avg).toBeCloseTo(0.5, 5);
    });

    it('returns 0 avg when no at-bats', () => {
        const stats = makeStats({ ab: 0, h: 0 });
        const result = calcBatting(stats);
        expect(result.avg).toBe(0);
    });

    it('calculates singles correctly', () => {
        const stats = makeStats({ ab: 10, h: 5, doubles: 1, triples: 1, hr: 1 });
        const result = calcBatting(stats);
        expect(result.singles).toBe(2); // 5 - 1 - 1 - 1
    });

    it('calculates total bases correctly', () => {
        // 2 singles(2) + 1 double(2) + 1 triple(3) + 1 HR(4) = 11
        const stats = makeStats({ ab: 10, h: 5, doubles: 1, triples: 1, hr: 1 });
        const result = calcBatting(stats);
        expect(result.tb).toBe(2 + 2 + 3 + 4); // 2 singles = 2×1, 1 double = 2, 1 triple = 3, 1 HR = 4
    });

    it('calculates OBP with walks and HBP', () => {
        const stats = makeStats({ ab: 4, h: 1, bb: 1, hbp: 1, sf: 0 });
        // OBP = (H + BB + HBP) / (AB + BB + HBP + SF) = 3/6 = 0.5
        const result = calcBatting(stats);
        expect(result.obp).toBeCloseTo(0.5, 5);
    });

    it('calculates OPS = OBP + SLG', () => {
        const stats = makeStats({ ab: 4, h: 2 });
        const result = calcBatting(stats);
        expect(result.ops).toBeCloseTo(result.obp + result.slg, 5);
    });

    it('aggregates multiple game stats correctly', () => {
        const g1 = makeStats({ ab: 4, h: 2 });
        const g2 = makeStats({ ab: 4, h: 0 });
        const result = calcBatting([g1, g2]);
        expect(result.avg).toBeCloseTo(0.25, 5); // 2/8
    });

    it('calculates PA correctly (AB + BB + HBP + SF + SAC)', () => {
        const stats = makeStats({ ab: 4, bb: 1, hbp: 1, sf: 1, sac: 1 });
        const result = calcBatting(stats);
        expect(result.pa).toBe(8);
    });
});

// ── calcPitching ──────────────────────────────────────────────────────────────

describe('calcPitching', () => {
    it('calculates ERA using 7-inning softball standard', () => {
        // ERA = (ER × 7) / IP
        // 7 ER in 7.0 innings → ERA = 7.00
        const stats = makeStats({ ip: 7.0, er: 7 });
        const result = calcPitching(stats);
        expect(result.era).toBeCloseTo(7.0, 2);
    });

    it('returns 0 ERA with 0 IP (safe division)', () => {
        const stats = makeStats({ ip: 0, er: 3 });
        const result = calcPitching(stats);
        expect(result.era).toBe(0);
    });

    it('calculates WHIP correctly', () => {
        // WHIP = (BB + H) / IP
        const stats = makeStats({ ip: 7.0, pH: 7, pBB: 7 });
        const result = calcPitching(stats);
        expect(result.whip).toBeCloseTo(2.0, 2); // (7+7)/7
    });

    it('calculates K/BB correctly', () => {
        const stats = makeStats({ ip: 7.0, pSO: 9, pBB: 3 });
        const result = calcPitching(stats);
        expect(result.kBB).toBeCloseTo(3.0, 2);
    });

    it('handles fractional innings (4.1 = 4⅓)', () => {
        const stats = makeStats({ ip: 4.1, er: 2 });
        const result = calcPitching(stats);
        // IP actual = 4 + 1/3 = 4.333...
        // ERA = 2 × 7 / 4.333 ≈ 3.23
        expect(result.era).toBeCloseTo((2 * 7) / (4 + 1 / 3), 1);
    });
});

// ── calcFielding ──────────────────────────────────────────────────────────────

describe('calcFielding', () => {
    it('calculates fielding percentage correctly', () => {
        const stats = makeStats({ po: 8, a: 2, e: 1 });
        const result = calcFielding(stats);
        // FLD% = (PO + A) / (PO + A + E) = 10/11
        expect(result.fldPct).toBeCloseTo(10 / 11, 5);
    });

    it('returns 0 FLD% when no chances', () => {
        const stats = makeStats({ po: 0, a: 0, e: 0 });
        const result = calcFielding(stats);
        expect(result.fldPct).toBe(0);
    });

    it('calculates CS% for catchers', () => {
        const stats = makeStats({ cCS: 3, cSB: 7 });
        const result = calcFielding(stats);
        // CS% = CS / (CS + SB) = 3/10 = 0.3
        expect(result.csPct).toBeCloseTo(0.3, 5);
    });
});

// ── parseIP / formatIP ────────────────────────────────────────────────────────

describe('parseIP', () => {
    it('parses whole innings', () => {
        expect(parseIP(7.0)).toBeCloseTo(7.0, 5);
    });

    it('parses fractional innings: 4.1 = 4⅓', () => {
        expect(parseIP(4.1)).toBeCloseTo(4 + 1 / 3, 5);
    });

    it('parses fractional innings: 4.2 = 4⅔', () => {
        expect(parseIP(4.2)).toBeCloseTo(4 + 2 / 3, 5);
    });
});

describe('formatIP', () => {
    it('formats whole innings as X.0', () => {
        expect(formatIP(7)).toBe('7.0');
    });

    it('formats fractional innings correctly', () => {
        expect(formatIP(4 + 1 / 3)).toBe('4.1');
        expect(formatIP(4 + 2 / 3)).toBe('4.2');
    });
});

// ── Formatters ────────────────────────────────────────────────────────────────

describe('formatAvg', () => {
    it('formats to 3 decimals, stripping leading zero', () => {
        expect(formatAvg(0.333)).toBe('.333');
        expect(formatAvg(0.5)).toBe('.500');
    });

    it('includes hits/ab when provided', () => {
        expect(formatAvg(0.5, 2, 4)).toBe('.500 (2/4)');
    });
});

describe('formatERA', () => {
    it('formats to 2 decimal places', () => {
        expect(formatERA(3.456)).toBe('3.46');
    });
});

describe('formatWHIP', () => {
    it('formats to 2 decimal places', () => {
        expect(formatWHIP(1.234)).toBe('1.23');
    });
});

// ── Performance level thresholds ──────────────────────────────────────────────

describe('getAvgLevel', () => {
    it('returns good for >= .300', () => {
        expect(getAvgLevel(0.300)).toBe('good');
        expect(getAvgLevel(0.400)).toBe('good');
    });
    it('returns average for >= .250 and < .300', () => {
        expect(getAvgLevel(0.280)).toBe('average');
    });
    it('returns poor for < .250', () => {
        expect(getAvgLevel(0.200)).toBe('poor');
    });
});

describe('getERALevel', () => {
    it('returns good for ERA < 3.00', () => {
        expect(getERALevel(2.50)).toBe('good');
    });
    it('returns average for 3.00–4.00', () => {
        expect(getERALevel(3.50)).toBe('average');
    });
    it('returns poor for > 4.00', () => {
        expect(getERALevel(5.00)).toBe('poor');
    });
});

describe('getFldLevel', () => {
    it('returns good for >= .975', () => {
        expect(getFldLevel(0.980)).toBe('good');
    });
    it('returns average for >= .950', () => {
        expect(getFldLevel(0.960)).toBe('average');
    });
    it('returns poor below .950', () => {
        expect(getFldLevel(0.900)).toBe('poor');
    });
});
