import type { Player, Game } from '../../types';
import { calcBatting, calcPitching, formatAvg, getAvgLevel } from '../../lib/calculations';
import { EmptyState } from '../ui/EmptyState';
import { useEffect } from 'react';

interface PlayersTabProps {
    players: Player[];
    games: Game[];
    onSelectPlayer?: (player: Player) => void;
    onAddPlayer?: () => void;
    highlightedItemId?: string | null;
}

export function PlayersTab({ players, games, onSelectPlayer, onAddPlayer, highlightedItemId }: PlayersTabProps) {
    // Get aggregated stats per player
    const getPlayerStats = (playerId: string) => {
        const playerGames = games.flatMap(g =>
            g.playerStats.filter(ps => ps.playerId === playerId)
        );
        if (playerGames.length === 0) return null;
        return calcBatting(playerGames);
    };

    useEffect(() => {
        if (highlightedItemId) {
            const el = document.getElementById(`player-row-${highlightedItemId}`) || document.getElementById(`player-card-${highlightedItemId}`);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                // Add a brief highlight flash
                el.style.transition = 'background-color 0.5s ease-out';
                const originalBg = el.style.backgroundColor;
                el.style.backgroundColor = 'var(--bg-card-hover)';
                setTimeout(() => {
                    el.style.backgroundColor = originalBg;
                }, 1500);
            }
        }
    }, [highlightedItemId]);

    return (
        <div className="dash-content">
            {/* Removed top-level section-header with Add Player button */}


            {players.length === 0 ? (
                <EmptyState
                    icon="👥"
                    title="Aún no hay jugadores"
                    message="Agrega jugadores al plantel para comenzar a seguir sus stats."
                    action={
                        <button className="btn btn-new" onClick={onAddPlayer}>
                            + Agregar Jugador
                        </button>
                    }
                />
            ) : (
                <>
                    {/* Roster Grid */}
                    {/* Roster Grid - Leaders */}
                    <div className="player-grid">
                        {(() => {
                            const leaders: { label: string; player: Player; stats: any; type: 'bat' | 'pit' }[] = [];
                            
                            // Pre-calculate all stats
                            const allPlayerStats = players.map(p => {
                                const pgs = games.flatMap(g => g.playerStats.filter(ps => ps.playerId === p.id));
                                return {
                                    player: p,
                                    bat: pgs.length > 0 ? calcBatting(pgs) : null,
                                    pit: pgs.some(s => s.ip > 0) ? calcPitching(pgs) : null,
                                    pgs
                                };
                            });

                            // 1. Leader AVG (min 1 AB)
                            const avgLeader = [...allPlayerStats]
                                .filter(s => s.bat && s.bat.pa > 0)
                                .sort((a, b) => (b.bat?.avg || 0) - (a.bat?.avg || 0))[0];
                            if (avgLeader) leaders.push({ label: 'LÍDER AVG', player: avgLeader.player, stats: avgLeader.bat, type: 'bat' });

                            // 2. Leader OBP
                            const obpLeader = [...allPlayerStats]
                                .filter(s => s.bat && s.bat.pa > 0)
                                .sort((a, b) => (b.bat?.obp || 0) - (a.bat?.obp || 0))[0];
                            if (obpLeader) leaders.push({ label: 'LÍDER OBP', player: obpLeader.player, stats: obpLeader.bat, type: 'bat' });

                            // 3. Leader SLG
                            const slgLeader = [...allPlayerStats]
                                .filter(s => s.bat && s.bat.pa > 0)
                                .sort((a, b) => (b.bat?.slg || 0) - (a.bat?.slg || 0))[0];
                            if (slgLeader) leaders.push({ label: 'LÍDER SLG', player: slgLeader.player, stats: slgLeader.bat, type: 'bat' });

                            // 4. Leader ERA (min 1 IP)
                            const eraLeader = [...allPlayerStats]
                                .filter(s => s.pit)
                                .sort((a, b) => (a.pit?.era || 99) - (b.pit?.era || 99))[0];
                            if (eraLeader) leaders.push({ label: 'LÍDER ERA', player: eraLeader.player, stats: eraLeader.pit, type: 'pit' });

                            // Fill with generic if not enough leaders
                            const displayed = leaders.slice(0, 4);
                            if (displayed.length < 4) {
                                const usedIds = new Set(displayed.map(l => l.player.id));
                                players.forEach(p => {
                                    if (displayed.length < 4 && !usedIds.has(p.id)) {
                                        const stats = allPlayerStats.find(s => s.player.id === p.id);
                                        displayed.push({ label: 'JUGADOR', player: p, stats: stats?.bat, type: 'bat' });
                                        usedIds.add(p.id);
                                    }
                                });
                            }

                            return displayed.map((l, i) => (
                                <div id={`player-card-${l.player.id}`} key={`${l.player.id}-${i}`} className="player-card" onClick={() => onSelectPlayer?.(l.player)} style={{ cursor: 'pointer', position: 'relative' }}>
                                    <div style={{ 
                                        position: 'absolute', 
                                        top: '12px', 
                                        left: '12px', 
                                        fontSize: '0.6rem', 
                                        fontWeight: '900', 
                                        color: 'var(--accent-primary)',
                                        background: 'var(--accent-soft)',
                                        padding: '2px 8px',
                                        borderRadius: 'var(--radius-sm)',
                                        letterSpacing: '0.05em'
                                    }}>
                                        {l.label}
                                    </div>
                                    <div className="player-avatar" style={{ fontSize: '2rem', background: 'var(--accent-gradient)', color: 'white' }}>
                                        {l.player.name.split(' ').map(n => n[0]).join('')}
                                    </div>
                                    <h3 className="text-bold">{l.player.name} #{l.player.jerseyNumber}</h3>
                                    <span className="player-info-pill">{l.player.primaryPosition}</span>

                                    <div className="player-stats-row">
                                        {l.type === 'bat' ? (
                                            <>
                                                <div className="stat-item">
                                                    <span className="label">AVG</span>
                                                    <span className={`val ${getAvgLevel(l.stats?.avg || 0)}`}>{l.stats ? formatAvg(l.stats.avg) : '.000'}</span>
                                                </div>
                                                <div className="stat-item">
                                                    <span className="label">OBP</span>
                                                    <span className="val">{l.stats ? formatAvg(l.stats.obp) : '.000'}</span>
                                                </div>
                                                <div className="stat-item">
                                                    <span className="label">SLG</span>
                                                    <span className="val">{l.stats ? formatAvg(l.stats.slg) : '.000'}</span>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div className="stat-item">
                                                    <span className="label">ERA</span>
                                                    <span className="val text-bold">{l.stats?.era.toFixed(2) || '0.00'}</span>
                                                </div>
                                                <div className="stat-item">
                                                    <span className="label">WHIP</span>
                                                    <span className="val">{l.stats?.whip.toFixed(2) || '0.00'}</span>
                                                </div>
                                                <div className="stat-item">
                                                    <span className="label">K/BB</span>
                                                    <span className="val">{l.stats?.kBB.toFixed(2) || '0.00'}</span>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ));
                        })()}
                        {/* Add Player Grid CTA */}
                        <div
                            className="player-card"
                            onClick={onAddPlayer}
                            style={{
                                cursor: 'pointer',
                                borderStyle: 'dashed',
                                background: 'var(--bg-subtle)',
                                justifyContent: 'center',
                                alignItems: 'center',
                                gap: 'var(--space-md)'
                            }}
                        >
                            <div className="player-avatar" style={{ background: 'var(--bg-card)', color: 'var(--accent-primary)', fontSize: '1.5rem' }}>+</div>
                            <h3 className="text-bold" style={{ color: 'var(--accent-primary)' }}>+ Agregar Jugador</h3>
                        </div>
                    </div>

                    {/* Statistics Table */}
                    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                        <div className="card-header" style={{ padding: 'var(--space-lg) var(--space-xl)', marginBottom: 0 }}>
                            <h3 className="card-title">Estadísticas Completas del Equipo</h3>
                        </div>
                        <div style={{ overflowX: 'auto' }}>
                            <table className="stat-table">
                                <thead>
                                    <tr>
                                        <th style={{ paddingLeft: 'var(--space-xl)' }}>Jugador</th>
                                        <th>Pos</th>
                                        <th>G</th>
                                        <th>AB</th>
                                        <th className="text-accent">AVG</th>
                                        <th>OBP</th>
                                        <th>SLG</th>
                                        <th>OPS</th>
                                        <th className="text-right" style={{ paddingRight: 'var(--space-xl)' }}>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {players.map(p => {
                                        const stats = getPlayerStats(p.id);
                                        const gCount = games.filter(g => g.playerStats.some(ps => ps.playerId === p.id)).length;
                                        const ab = games.flatMap(g => g.playerStats.filter(ps => ps.playerId === p.id)).reduce((s, ps) => s + ps.ab, 0);

                                        return (
                                            <tr id={`player-row-${p.id}`} key={p.id}>
                                                <td className="text-bold" style={{ paddingLeft: 'var(--space-xl)' }}>{p.name}</td>
                                                <td><span className="player-info-pill" style={{ fontSize: '0.65rem' }}>{p.primaryPosition}</span></td>
                                                <td className="text-mono">{gCount}</td>
                                                <td className="text-mono">{ab}</td>
                                                <td><span className={`stat-value ${getAvgLevel(stats?.avg || 0)}`}>{stats ? formatAvg(stats.avg) : '.000'}</span></td>
                                                <td className="text-mono">{stats ? formatAvg(stats.obp) : '.000'}</td>
                                                <td className="text-mono">{stats ? formatAvg(stats.slg) : '.000'}</td>
                                                <td className="text-mono">{stats ? formatAvg(stats.ops) : '.000'}</td>
                                                <td className="text-right" style={{ paddingRight: 'var(--space-xl)' }}>
                                                    <button className="btn btn-ghost" style={{ padding: '4px 8px' }} onClick={() => onSelectPlayer?.(p)}>•••</button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        <div className="modal-footer" style={{ borderTop: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-md) var(--space-xl)' }}>
                            <span className="text-muted" style={{ fontSize: '0.75rem' }}>Mostrando {players.length} jugadores</span>
                            <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                                <button className="btn btn-secondary" style={{ padding: '4px 12px', fontSize: '0.75rem' }}>Ant.</button>
                                <button className="btn btn-secondary" style={{ padding: '4px 12px', fontSize: '0.75rem' }}>Sig.</button>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
