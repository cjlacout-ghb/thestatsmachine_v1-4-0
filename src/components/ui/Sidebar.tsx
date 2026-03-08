import type { TabId, Tournament, Team } from '../../types';

interface SidebarProps {
    activeTab: TabId;
    setActiveTab: (tab: 'players' | 'tournaments' | 'team' | 'games' | 'stats') => void;
    activeTeam: Team | null;
    activeTournament: Tournament | null;
    onExitTournament: () => void;
    tournaments?: Tournament[];
    onSelectTournament?: (t: Tournament) => void;
}

export function Sidebar({ activeTab, setActiveTab, activeTeam, activeTournament, onExitTournament, tournaments = [], onSelectTournament }: SidebarProps) {
    if (!activeTeam) return null;

    return (
        <aside className="app-sidebar">
            {/* PROMINENT ENTRY POINT */}
            <div className="sidebar-group" style={{ marginBottom: '0' }}>
                <h3 className="sidebar-header" style={{
                    color: 'var(--accent-primary)',
                    fontSize: '0.9rem',
                    fontWeight: '900',
                    borderLeft: '4px solid var(--accent-primary)',
                    paddingLeft: '8px',
                    marginBottom: '0'
                }}>
                    ZONA DE CARGA
                </h3>
            </div>

            <div className="sidebar-divider"></div>

            {/* TEAM SECTION */}
            <div className="sidebar-group">
                <h3 className="sidebar-header">EQUIPO</h3>
                <nav className="sidebar-nav">
                    <button
                        className={`sidebar-item ${activeTab === 'team' && !activeTournament ? 'active' : ''}`}
                        onClick={() => { onExitTournament(); setActiveTab('team'); }}
                    >
                        <span className="icon">🏢</span>
                        <span>Resumen</span>
                    </button>
                    <button
                        className={`sidebar-item ${activeTab === 'players' && !activeTournament ? 'active' : ''}`}
                        onClick={() => { onExitTournament(); setActiveTab('players'); }}
                    >
                        <span className="icon">👥</span>
                        <span>Jugadores</span>
                    </button>
                    <button
                        className={`sidebar-item ${activeTab === 'stats' && !activeTournament ? 'active' : ''}`}
                        onClick={() => { onExitTournament(); setActiveTab('stats'); }}
                    >
                        <span className="icon">📊</span>
                        <span>Estadísticas</span>
                    </button>
                </nav>
            </div>

            <div className="sidebar-divider"></div>

            {/* EVENTS SECTION */}
            <div className="sidebar-group">
                <h3 className="sidebar-header">EVENTOS</h3>
                <nav className="sidebar-nav">
                    <button
                        className={`sidebar-item ${activeTab === 'tournaments' && !activeTournament ? 'active' : ''}`}
                        onClick={() => { onExitTournament(); setActiveTab('tournaments'); }}
                    >
                        <span className="icon">🏆</span>
                        <span>Todos los Eventos</span>
                    </button>

                    {tournaments.map(t => (
                        <button
                            key={t.id}
                            className={`sidebar-item ${activeTournament?.id === t.id ? 'active' : ''}`}
                            onClick={() => {
                                if (onSelectTournament) onSelectTournament(t);
                            }}
                            style={{ paddingLeft: '2.5rem', fontSize: '0.9em' }}
                            title={t.name}
                        >
                            <span style={{
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                maxWidth: '100%'
                            }}>
                                {t.name}
                            </span>
                        </button>
                    ))}
                </nav>

                {/* ACTIVE EVENT SUB-SECTION */}
                {activeTournament && (
                    <div className="active-event-card mt-md">
                        <div className="event-name-label">EVENTO ACTIVO</div>
                        <div className="event-name">{activeTournament.name}</div>
                        <nav className="sidebar-nav mt-sm">
                            <button
                                className={`sidebar-item ${activeTab === 'games' ? 'active' : ''}`}
                                onClick={() => setActiveTab('games')}
                            >
                                <span className="icon">📅</span>
                                <span>Registro de Partidos</span>
                            </button>
                            <button
                                className={`sidebar-item ${activeTab === 'stats' ? 'active' : ''}`}
                                onClick={() => setActiveTab('stats')}
                            >
                                <span className="icon">📊</span>
                                <span>Stats</span>
                            </button>
                        </nav>
                        <button className="btn-link-sm mt-md text-danger" onClick={onExitTournament}>
                            × Salir del Evento
                        </button>
                    </div>
                )}
            </div>
        </aside>
    );
}
