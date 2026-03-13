import type { Tournament, Game, Team } from '../../types';
import { EmptyState } from '../ui/EmptyState';


interface TournamentsTabProps {
    tournaments: Tournament[];
    games: Game[]; // To show game count
    teams: Team[];
    onSelectTournament: (t: Tournament) => void;
    onAddTournament: () => void;
    onEditTournament: (t: Tournament) => void;
    onDeleteTournament: (t: Tournament) => void;
    onAddGameToTournament: (t: Tournament) => void;
    onViewStats: (t: Tournament) => void;
}

export function TournamentsTab({
    tournaments,
    games,
    teams: _teams,
    onSelectTournament,
    onAddTournament,
    onEditTournament: _onEditTournament,
    onDeleteTournament: _onDeleteTournament,
    onAddGameToTournament,
    onViewStats
}: TournamentsTabProps) {
    return (
        <div className="dash-content">
            {/* Removed redundant section-header */}


            {tournaments.length === 0 ? (
                <EmptyState
                    icon="🏆"
                    title="Aún no hay Eventos"
                    message="Creá un evento o liga para comenzar a seguir los partidos."
                    action={
                        <button className="btn btn-new" onClick={onAddTournament}>
                            + Agregar Evento
                        </button>
                    }
                />
            ) : (
                <div className="card-grid">
                    {tournaments.map(t => {
                        const tGames = games.filter(g => g.tournamentId === t.id);
                        const gameCount = tGames.length;
                        const winCount = tGames.filter(g => g.teamScore > g.opponentScore).length;

                        return (
                            <div key={t.id} className="card hover-card" onClick={() => onSelectTournament(t)} style={{ cursor: 'pointer', padding: 'var(--space-xl)', display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 'var(--space-sm)' }}>
                                    <h3 className="card-title" style={{ fontSize: '1.25rem', fontWeight: '800', margin: 0 }}>
                                        {t.name}
                                    </h3>
                                    <button 
                                        className="btn btn-primary" 
                                        onClick={(e) => { e.stopPropagation(); onAddGameToTournament(t); }}
                                    >
                                        + Agregar Partido
                                    </button>
                                </div>

                                <div className="stat-grid-mini" style={{ display: 'flex', gap: '3rem', margin: 'var(--space-md) 0' }}>
                                    <div className="stat" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <span className="label" style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Partidos Jugados</span>
                                        <span className="value" style={{ fontWeight: '800', fontSize: '1.5rem', color: 'var(--text-primary)' }}>{gameCount}</span>
                                    </div>
                                    <div className="stat" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <span className="label" style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Record</span>
                                        <span className="value" style={{ fontWeight: '800', fontSize: '1.5rem', color: 'var(--text-primary)' }}>{winCount} - {gameCount - winCount}</span>
                                    </div>
                                </div>

                                <div style={{
                                    display: 'flex',
                                    gap: 'var(--space-md)',
                                    marginTop: 'auto',
                                    borderTop: '1px solid var(--border-light)',
                                    paddingTop: 'var(--space-lg)'
                                }}>
                                    <button className="btn btn-secondary btn-sm" style={{ flex: 1, padding: '0.5rem' }} onClick={(e) => { e.stopPropagation(); onViewStats(t); }}>
                                        🏆 Posiciones
                                    </button>
                                    <button className="btn btn-secondary btn-sm" style={{ flex: 1, padding: '0.5rem' }} onClick={(e) => { e.stopPropagation(); onViewStats(t); }}>
                                        📈 Stats Jugadores
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
