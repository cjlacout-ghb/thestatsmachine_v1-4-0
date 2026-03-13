import type { Game, Player, Tournament } from '../../types';
import { EmptyState } from '../ui/EmptyState';
import { getMonthStr, getDayStr } from '../../lib/dateUtils';
import { useEffect, useMemo } from 'react';
import { translateGameType, translateCondition } from '../../lib/translations';

interface GamesTabProps {
    games: Game[];
    players: Player[];
    tournament?: Tournament | null;
    onSelectGame?: (game: Game) => void;
    onAddGame?: () => void;
    onEditTournament?: (t: Tournament) => void;
    onDeleteTournament?: (id: string) => void;
    onDeleteGame?: (id: string) => void;
    onOpenPlayerStats?: (game: Game) => void;
    teamName?: string;
    highlightedItemId?: string | null;
}

export function GamesTab({ games, tournament: _tournament, onSelectGame, onAddGame, onEditTournament: _onEditTournament, onDeleteTournament: _onDeleteTournament, onDeleteGame, onOpenPlayerStats, teamName = 'Team', highlightedItemId }: GamesTabProps) {
    if (games.length === 0) {
        return (
            <div className="dash-content">
                <EmptyState
                    icon="📅"
                    title="Aún no hay Partidos"
                    message="Agrega un partido para comenzar a seguir las estadísticas."
                    action={
                        <button className="btn btn-new" onClick={onAddGame}>
                            + Agregar Partido
                        </button>
                    }
                />
            </div>
        );
    }

    // ─── Sorting ──────────────────────────────────────
    const sortedGames = useMemo(() => {
        return [...games].sort((a, b) =>
            new Date(a.date).getTime() - new Date(b.date).getTime()
        );
    }, [games]);

    useEffect(() => {
        if (highlightedItemId) {
            const el = document.getElementById(`game-card-${highlightedItemId}`);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                el.style.transition = 'background-color 0.5s ease-out';
                el.style.backgroundColor = 'var(--bg-card-hover)';
                setTimeout(() => { el.style.backgroundColor = ''; }, 1500);
            }
        }
    }, [highlightedItemId]);

    return (
        <div className="dash-content">
            <div style={{ display: 'grid', gap: 'var(--space-lg)' }}>
                {sortedGames.map((game: Game) => {
                    // [R-12] Subject of the record is game.teamName, not the UI context teamName
                    const recordSubject = (game.teamName || teamName);
                    const isWin = game.teamScore > game.opponentScore;
                    const isLoss = game.teamScore < game.opponentScore;

                    // Labels must be relative to the record itself to avoid "A @ A" errors
                    const visitorTeam = game.homeAway === 'away' ? recordSubject : game.opponent;
                    const homeTeam = game.homeAway === 'home' ? recordSubject : game.opponent;

                    // UI Highlighting relative to context (if desired)

                    const statusLabel = isWin ? 'GANA' : isLoss ? 'PIERDE' : 'EMPATE';

                    return (
                        <div
                            id={`game-card-${game.id}`}
                            key={game.id}
                            className={`card ${highlightedItemId === game.id ? 'highlighted' : ''}`}
                            onClick={() => onSelectGame?.(game)}
                            style={{ cursor: 'pointer', padding: 'var(--space-lg) var(--space-xl)' }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xl)' }}>
                                    <div className="text-center" style={{ minWidth: '50px' }}>
                                        <div className="text-bold text-muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase' }}>
                                            {getMonthStr(game.date)}
                                        </div>
                                        <div className="text-bold" style={{ fontSize: '1.5rem', lineHeight: 1 }}>
                                            {getDayStr(game.date)}
                                        </div>
                                    </div>

                                    <div className="divider" style={{ width: '1px', height: '40px', margin: '0' }} />

                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: '4px' }}>
                                            <span style={{
                                                fontSize: '0.625rem',
                                                fontWeight: '900',
                                                padding: '2px 8px',
                                                borderRadius: 'var(--radius-sm)',
                                                background: isWin ? 'var(--elite)' : isLoss ? 'var(--under)' : 'var(--avg)',
                                                color: 'white'
                                            }}>
                                                {statusLabel}
                                            </span>
                                            <h4 className="text-bold" style={{ fontSize: '1.125rem' }}>
                                                {visitorTeam} @ {homeTeam}
                                            </h4>
                                        </div>
                                        <div className="text-muted" style={{ fontSize: '0.8125rem', fontWeight: '500' }}>
                                            {game.homeAway === 'home' ? '🏠 Local' : '✈ Visitante'} • {translateGameType(game.gameType)} • {translateCondition(game.condition || 'REGULAR')}
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-lg)' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', minWidth: '150px' }}>
                                        <div className="text-mono text-bold" style={{
                                            fontSize: '2rem',
                                            color: isWin ? 'var(--elite)' : isLoss ? 'var(--under)' : 'var(--text-primary)',
                                            lineHeight: 1
                                        }}>
                                            {game.homeAway === 'home' ? (
                                                <>{game.opponentScore} - {game.teamScore}</>
                                            ) : (
                                                <>{game.teamScore} - {game.opponentScore}</>
                                            )}
                                        </div>
                                        <div className="text-muted" style={{ fontSize: '0.75rem', fontWeight: '800', marginTop: '4px' }}>
                                            {game.homeAway === 'home' ? (
                                                <>{game.opponentInningsPlayed?.toFixed(1) || '7.0'} - {game.inningsPlayed?.toFixed(1) || '7.0'}</>
                                            ) : (
                                                <>{game.inningsPlayed?.toFixed(1) || '7.0'} - {game.opponentInningsPlayed?.toFixed(1) || '7.0'}</>
                                            )} INN
                                        </div>
                                        <button
                                            className="btn btn-secondary btn-sm mt-sm"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (onOpenPlayerStats) onOpenPlayerStats(game);
                                            }}
                                        >
                                            {game.playerStats && game.playerStats.length > 0 ? "✅ Stats Jugadores" : "📈 Stats Jugadores"}
                                        </button>
                                    </div>

                                    {onDeleteGame && (
                                        <button
                                            className="btn btn-ghost btn-sm"
                                            title="Eliminar Partido"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onDeleteGame(game.id);
                                            }}
                                            style={{ color: 'var(--under)', padding: '8px' }}
                                        >
                                            🗑️
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}

                {/* In-page Add Game card */}
                <div
                    className="card dashed-border flex-center"
                    onClick={onAddGame}
                    style={{ minHeight: '100px', cursor: 'pointer', background: 'var(--bg-subtle)', padding: 'var(--space-lg)' }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                        <div className="icon-circle" style={{ background: 'var(--bg-card)', fontSize: '1.2rem', width: '40px', height: '40px' }}>+</div>
                        <div>
                            <h3 className="text-bold" style={{ fontSize: '1rem' }}>+ Registrar Nuevo Partido</h3>
                            <p className="text-muted text-sm">Agregar otro partido a este evento</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
