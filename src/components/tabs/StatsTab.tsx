import { useState, useMemo } from 'react';
import type { Game, Player, Tournament } from '../../types';
import { calcBatting, calcPitching, calcFielding, formatAvg, formatERA, formatWHIP, formatIP, parseIP, getAvgLevel, getERALevel, getFldLevel } from '../../lib/calculations';
import { StatTable } from '../ui/StatTable';
import { EmptyState } from '../ui/EmptyState';
import { exportTournamentReport } from '../../lib/pdfGenerator';

type StatsView = 'batting' | 'pitching' | 'fielding';

interface StatsTabProps {
    games: Game[];
    players: Player[];
    tournament?: Tournament | null;
    onAddGame?: () => void;
    onAddPlayer?: () => void;
}

// ─── Batting Leaderboard ──────────────────────────────────────────────────────
interface PlayerBattingRow {
    id: string; name: string; pos: string; g: number;
    ab: number; h: number; doubles: number; triples: number; hr: number;
    rbi: number; r: number; bb: number; so: number;
    avg: number; obp: number; slg: number; ops: number;
}

// ─── Pitching Leaderboard ────────────────────────────────────────────────────
interface PlayerPitchingRow {
    id: string; name: string; pos: string; g: number;
    ip: number; ipDisplay: string;
    h: number; er: number; bb: number; so: number; hr: number; pitchCount: number;
    era: number; whip: number; kPerBB: number;
}

// ─── Fielding Leaderboard ────────────────────────────────────────────────────
interface PlayerFieldingRow {
    id: string; name: string; pos: string; g: number;
    po: number; a: number; e: number; tc: number;
    fldPct: number;
    cCS?: number; cSB?: number;
}

export function StatsTab({ games, players, tournament, onAddGame, onAddPlayer }: StatsTabProps) {
    const [view, setView] = useState<StatsView>('batting');

    // ── Build batting rows ──────────────────────────────────────────────────
    const battingData: PlayerBattingRow[] = useMemo(() => players.map(player => {
        const pgs = games.flatMap(g => g.playerStats.filter(ps => ps.playerId === player.id));
        const s = calcBatting(pgs);
        return {
            id: player.id, name: player.name, pos: player.primaryPosition,
            g: pgs.length,
            ab: pgs.reduce((t, g) => t + g.ab, 0),
            h: pgs.reduce((t, g) => t + g.h, 0),
            doubles: pgs.reduce((t, g) => t + g.doubles, 0),
            triples: pgs.reduce((t, g) => t + g.triples, 0),
            hr: pgs.reduce((t, g) => t + g.hr, 0),
            rbi: pgs.reduce((t, g) => t + g.rbi, 0),
            r: pgs.reduce((t, g) => t + g.r, 0),
            bb: pgs.reduce((t, g) => t + g.bb, 0),
            so: pgs.reduce((t, g) => t + g.so, 0),
            avg: s.avg, obp: s.obp, slg: s.slg, ops: s.ops,
        };
    }).filter(p => p.g > 0), [games, players]);

    // ── Build pitching rows ─────────────────────────────────────────────────
    const pitchingData: PlayerPitchingRow[] = useMemo(() => players.map(player => {
        const pgs = games.flatMap(g => g.playerStats.filter(ps => ps.playerId === player.id && ps.ip > 0));
        if (pgs.length === 0) return null;
        const s = calcPitching(pgs);
        const ipRaw = pgs.reduce((t, g) => t + parseIP(g.ip), 0);
        return {
            id: player.id, name: player.name, pos: player.primaryPosition,
            g: pgs.length,
            ip: ipRaw, ipDisplay: formatIP(ipRaw),
            h: pgs.reduce((t, g) => t + g.pH, 0),
            er: pgs.reduce((t, g) => t + g.er, 0),
            bb: pgs.reduce((t, g) => t + g.pBB, 0),
            so: pgs.reduce((t, g) => t + g.pSO, 0),
            hr: pgs.reduce((t, g) => t + g.pHR, 0),
            pitchCount: pgs.reduce((t, g) => t + g.pitchCount, 0),
            era: s.era, whip: s.whip, kPerBB: s.kBB,
        };
    }).filter(Boolean) as PlayerPitchingRow[], [games, players]);

    // ── Build fielding rows ─────────────────────────────────────────────────
    const fieldingData: PlayerFieldingRow[] = useMemo(() => players.map(player => {
        const pgs = games.flatMap(g => g.playerStats.filter(ps => ps.playerId === player.id && (ps.po > 0 || ps.a > 0 || ps.e > 0)));
        if (pgs.length === 0) return null;
        const s = calcFielding(pgs);
        const po = pgs.reduce((t, g) => t + g.po, 0);
        const a = pgs.reduce((t, g) => t + g.a, 0);
        const e = pgs.reduce((t, g) => t + g.e, 0);
        return {
            id: player.id, name: player.name, pos: player.primaryPosition,
            g: pgs.length,
            po, a, e, tc: po + a + e,
            fldPct: s.fldPct,
            cCS: pgs.reduce((t, g) => t + (g.cCS ?? 0), 0),
            cSB: pgs.reduce((t, g) => t + (g.cSB ?? 0), 0),
        };
    }).filter(Boolean) as PlayerFieldingRow[], [games, players]);

    // ── Column definitions ──────────────────────────────────────────────────
    const battingColumns = [
        { key: 'name', label: 'Player', className: 'text', sortable: true },
        { key: 'pos', label: 'POS', sortable: true },
        { key: 'g', label: 'G', sortable: true },
        { key: 'ab', label: 'AB', sortable: true },
        { key: 'r', label: 'R', sortable: true },
        { key: 'h', label: 'H', sortable: true },
        { key: 'doubles', label: '2B', sortable: true },
        { key: 'triples', label: '3B', sortable: true },
        { key: 'hr', label: 'HR', sortable: true },
        { key: 'rbi', label: 'RBI', sortable: true },
        { key: 'bb', label: 'BB', sortable: true },
        { key: 'so', label: 'SO', sortable: true },
        {
            key: 'avg', label: 'AVG', sortable: true,
            render: (row: PlayerBattingRow) => (
                <span className={`stat-value ${getAvgLevel(row.avg)}`}>{formatAvg(row.avg)}</span>
            )
        },
        { key: 'obp', label: 'OBP', sortable: true, render: (row: PlayerBattingRow) => <span className="text-mono">{formatAvg(row.obp)}</span> },
        { key: 'slg', label: 'SLG', sortable: true, render: (row: PlayerBattingRow) => <span className="text-mono">{formatAvg(row.slg)}</span> },
        { key: 'ops', label: 'OPS', sortable: true, render: (row: PlayerBattingRow) => <span className="text-mono text-bold">{formatAvg(row.ops)}</span> },
    ];

    const pitchingColumns = [
        { key: 'name', label: 'Player', className: 'text', sortable: true },
        { key: 'pos', label: 'POS', sortable: true },
        { key: 'g', label: 'G', sortable: true },
        { key: 'ipDisplay', label: 'IP', sortable: true },
        {
            key: 'era', label: 'ERA', sortable: true,
            render: (row: PlayerPitchingRow) => (
                <span className={`stat-value ${getERALevel(row.era)}`}>{formatERA(row.era)}</span>
            )
        },
        { key: 'whip', label: 'WHIP', sortable: true, render: (row: PlayerPitchingRow) => <span className="text-mono">{formatWHIP(row.whip)}</span> },
        { key: 'so', label: 'SO', sortable: true },
        { key: 'bb', label: 'BB', sortable: true },
        { key: 'h', label: 'H', sortable: true },
        { key: 'er', label: 'ER', sortable: true },
        { key: 'hr', label: 'HR', sortable: true },
        { key: 'pitchCount', label: 'PC', sortable: true },
    ];

    const fieldingColumns = [
        { key: 'name', label: 'Player', className: 'text', sortable: true },
        { key: 'pos', label: 'POS', sortable: true },
        { key: 'g', label: 'G', sortable: true },
        { key: 'po', label: 'PO', sortable: true },
        { key: 'a', label: 'A', sortable: true },
        { key: 'e', label: 'E', sortable: true },
        { key: 'tc', label: 'TC', sortable: true },
        {
            key: 'fldPct', label: 'FLD%', sortable: true,
            render: (row: PlayerFieldingRow) => (
                <span className={`stat-value ${getFldLevel(row.fldPct)}`}>{formatAvg(row.fldPct)}</span>
            )
        },
        {
            key: 'cCS', label: 'CS', sortable: true,
            render: (row: PlayerFieldingRow) => row.pos === 'C'
                ? <span className="text-mono">{row.cCS ?? '—'}</span>
                : <span className="text-muted">—</span>
        },
        {
            key: 'cSB', label: 'SB-A', sortable: true,
            render: (row: PlayerFieldingRow) => row.pos === 'C'
                ? <span className="text-mono">{row.cSB ?? '—'}</span>
                : <span className="text-muted">—</span>
        },
    ];

    if (games.length === 0 || players.length === 0) {
        return (
            <div className="dash-content">
                <EmptyState
                    icon="📊"
                    title="No Statistics Available"
                    message="Add players and games to see detailed statistics."
                    action={
                        <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
                            <button className="btn btn-new" onClick={onAddPlayer}>+ Add Player</button>
                            <button className="btn btn-new" onClick={onAddGame}>+ Add Game</button>
                        </div>
                    }
                />
            </div>
        );
    }

    const tabStyle = (active: boolean): React.CSSProperties => ({
        padding: '6px 18px',
        border: 'none',
        borderRadius: 'var(--radius-sm)',
        fontSize: '0.8rem',
        fontWeight: '700',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        background: active ? 'var(--accent-primary)' : 'transparent',
        color: active ? 'white' : 'var(--text-muted)',
    });

    return (
        <div className="dash-content">
            {/* Tab Switcher */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 'var(--space-lg)',
                flexWrap: 'wrap',
                gap: 'var(--space-md)'
            }}>
                <div style={{
                    display: 'inline-flex',
                    background: 'var(--bg-primary)',
                    borderRadius: 'var(--radius-md)',
                    padding: '4px',
                    gap: '2px',
                }}>
                    <button style={tabStyle(view === 'batting')} onClick={() => setView('batting')}>⚾ Batting</button>
                    <button style={tabStyle(view === 'pitching')} onClick={() => setView('pitching')}>🥎 Pitching</button>
                    <button style={tabStyle(view === 'fielding')} onClick={() => setView('fielding')}>🧤 Fielding</button>
                </div>

                <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => {
                        const exportTourney = tournament || { id: 'season', name: 'Season Totals', location: '', startDate: '', endDate: '' } as Tournament;
                        exportTournamentReport(exportTourney, players, games);
                    }}
                    style={{ color: 'var(--accent-primary)', fontWeight: '700' }}
                >
                    📄 Export PDF Report
                </button>
            </div>

            {/* BATTING LEADERBOARD */}
            {view === 'batting' && (
                <>
                    <div className="stat-table-wrapper card" style={{ padding: 0, overflow: 'hidden' }}>
                        <StatTable data={battingData} columns={battingColumns} keyField="id" />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'var(--space-xl)' }}>
                        <div className="text-muted" style={{ fontSize: '0.8125rem', fontWeight: '500' }}>
                            Showing <strong className="text-primary">{battingData.length}</strong> players with plate appearances
                        </div>
                        <PerformanceLegend />
                    </div>
                </>
            )}

            {/* PITCHING LEADERBOARD */}
            {view === 'pitching' && (
                <>
                    {pitchingData.length === 0 ? (
                        <EmptyState
                            icon="🥎"
                            title="No Pitching Stats"
                            message="Enter innings pitched (IP > 0) in a game's Player Stats tab to see pitching data here."
                        />
                    ) : (
                        <>
                            <div className="stat-table-wrapper card" style={{ padding: 0, overflow: 'hidden' }}>
                                <StatTable data={pitchingData} columns={pitchingColumns} keyField="id" />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'var(--space-xl)' }}>
                                <div className="text-muted" style={{ fontSize: '0.8125rem', fontWeight: '500' }}>
                                    Showing <strong className="text-primary">{pitchingData.length}</strong> pitchers · ERA uses 7-inning softball standard
                                </div>
                                <PerformanceLegend />
                            </div>
                        </>
                    )}
                </>
            )}

            {/* FIELDING LEADERBOARD */}
            {view === 'fielding' && (
                <>
                    {fieldingData.length === 0 ? (
                        <EmptyState
                            icon="🧤"
                            title="No Fielding Stats"
                            message="Enter PO, A, or E values in a game's Player Stats tab to see fielding data here."
                        />
                    ) : (
                        <>
                            <div className="stat-table-wrapper card" style={{ padding: 0, overflow: 'hidden' }}>
                                <StatTable data={fieldingData} columns={fieldingColumns} keyField="id" />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'var(--space-xl)' }}>
                                <div className="text-muted" style={{ fontSize: '0.8125rem', fontWeight: '500' }}>
                                    Showing <strong className="text-primary">{fieldingData.length}</strong> fielders · CS/SB-A shown for catchers only
                                </div>
                                <PerformanceLegend />
                            </div>
                        </>
                    )}
                </>
            )}
        </div>
    );
}

function PerformanceLegend() {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-lg)' }}>
            <span className="text-bold text-muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase' }}>Legend:</span>
            <div style={{ display: 'flex', gap: '16px', fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--elite)' }}></div>
                    <span style={{ color: 'var(--elite)' }}>Elite</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--avg)' }}></div>
                    <span style={{ color: 'var(--avg)' }}>Avg</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--under)' }}></div>
                    <span style={{ color: 'var(--under)' }}>Under</span>
                </div>
            </div>
        </div>
    );
}
