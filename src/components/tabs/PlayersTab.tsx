import type { Player, Game } from '../../types';
import { calcBatting, formatAvg, getAvgLevel } from '../../lib/calculations';
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
                    <div className="player-grid">
                        {players.slice(0, 4).map(p => {
                            const stats = getPlayerStats(p.id);
                            return (
                                <div id={`player-card-${p.id}`} key={p.id} className="player-card" onClick={() => onSelectPlayer?.(p)} style={{ cursor: 'pointer' }}>
                                    <div className="player-avatar" style={{ fontSize: '2rem', background: 'var(--accent-gradient)', color: 'white' }}>
                                        {p.name.split(' ').map(n => n[0]).join('')}
                                    </div>
                                    <h3 className="text-bold">{p.name} #{p.jerseyNumber}</h3>
                                    <span className="player-info-pill">{p.primaryPosition}</span>

                                    <div className="player-stats-row">
                                        <div className="stat-item">
                                            <span className="label">AVG</span>
                                            <span className={`val ${getAvgLevel(stats?.avg || 0)}`}>{stats ? formatAvg(stats.avg) : '.000'}</span>
                                        </div>
                                        <div className="stat-item">
                                            <span className="label">OBP</span>
                                            <span className="val">{stats ? formatAvg(stats.obp) : '.000'}</span>
                                        </div>
                                        <div className="stat-item">
                                            <span className="label">SLG</span>
                                            <span className="val">{stats ? formatAvg(stats.slg) : '.000'}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
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
                            <h3 className="text-bold" style={{ color: 'var(--accent-primary)' }}>Agregar Jugador</h3>
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
