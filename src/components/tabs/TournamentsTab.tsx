import type { Tournament, Game, Team } from '../../types';
import { EmptyState } from '../ui/EmptyState';
import { formatLocalDate } from '../../lib/dateUtils';


interface TournamentsTabProps {
    tournaments: Tournament[];
    games: Game[]; // To show game count
    teams: Team[];
    onSelectTournament: (t: Tournament) => void;
    onAddTournament: () => void;
    onEditTournament: (t: Tournament) => void;
    onDeleteTournament: (t: Tournament) => void;
    onAddGameToTournament: (t: Tournament) => void;
    onSwitchTeam: () => void;
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
    onSwitchTeam,
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
                            <div key={t.id} className="card hover-card" onClick={() => onSelectTournament(t)} style={{ cursor: 'pointer' }}>
                                <div className="card-header" style={{ paddingBottom: '0.5rem' }}>
                                    <div>
                                        <h3 className="card-title" style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{t.name}</h3>
                                    </div>
                                </div>

                                <div className="card-body" style={{ paddingTop: '0.5rem', paddingBottom: '1rem' }}>
                                    <div className="stat-grid-mini" style={{ display: 'flex', gap: '2rem' }}>
                                        <div className="stat" style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span className="label" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Partidos Jugados</span>
                                            <span className="value" style={{ fontWeight: 'bold', fontSize: '1.25rem' }}>{gameCount}</span>
                                        </div>
                                        <div className="stat" style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span className="label" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Record</span>
                                            <span className="value" style={{ fontWeight: 'bold', fontSize: '1.25rem' }}>{winCount} - {gameCount - winCount}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="card-footer" style={{
                                    marginTop: 'var(--space-md)',
                                    paddingTop: 'var(--space-md)',
                                    borderTop: '1px solid var(--border-light)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '0.5rem'
                                }}>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button className="btn btn-secondary btn-sm" style={{ flex: 1, padding: '0.5rem' }} onClick={(e) => { e.stopPropagation(); onViewStats(t); }}>
                                            📊 Posiciones
                                        </button>
                                        <button className="btn btn-secondary btn-sm" style={{ flex: 1, padding: '0.5rem' }} onClick={(e) => { e.stopPropagation(); onAddGameToTournament(t); }}>
                                            ➕ Agregar Partido
                                        </button>
                                        <button className="btn btn-secondary btn-sm" style={{ flex: 1, padding: '0.5rem' }} onClick={(e) => { e.stopPropagation(); onSwitchTeam(); }}>
                                            👤 Cambiar Equipo
                                        </button>
                                        <button className="btn btn-secondary btn-sm" style={{ flex: 1, padding: '0.5rem' }} onClick={(e) => { e.stopPropagation(); onViewStats(t); }}>
                                            📈 Stats Jugadores
                                        </button>
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                                        {formatLocalDate(t.startDate)} · {t.type}
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {/* Add New Card */}
                    <div
                        className="card dashed-border flex-center"
                        onClick={onAddTournament}
                        style={{ minHeight: '200px', cursor: 'pointer', background: 'var(--bg-subtle)' }}
                    >
                        <div className="text-center">
                            <div className="icon-circle mb-md" style={{ background: 'var(--bg-card)', fontSize: '1.5rem' }}>+</div>
                            <h3 className="text-bold mb-sm">Agregar Evento</h3>
                            <p className="text-muted text-sm">Crear nuevo torneo</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
