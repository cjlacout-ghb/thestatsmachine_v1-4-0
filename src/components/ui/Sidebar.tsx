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
            {/* TEAM SECTION */}
            <div className="sidebar-group">
                <h3 className="sidebar-header">TEAM</h3>
                <nav className="sidebar-nav">
                    <button
                        className={`sidebar-item ${activeTab === 'team' && !activeTournament ? 'active' : ''}`}
                        onClick={() => { onExitTournament(); setActiveTab('team'); }}
                    >
                        <span className="icon">🏢</span>
                        <span>Overview</span>
                    </button>
                    <button
                        className={`sidebar-item ${activeTab === 'players' && !activeTournament ? 'active' : ''}`}
                        onClick={() => { onExitTournament(); setActiveTab('players'); }}
                    >
                        <span className="icon">👥</span>
                        <span>Roster</span>
                    </button>
                    <button
                        className={`sidebar-item ${activeTab === 'stats' && !activeTournament ? 'active' : ''}`}
                        onClick={() => { onExitTournament(); setActiveTab('stats'); }}
                    >
                        <span className="icon">📊</span>
                        <span>Season Stats</span>
                    </button>
                </nav>
            </div>

            <div className="sidebar-divider"></div>

            {/* EVENTS SECTION */}
            <div className="sidebar-group">
                <h3 className="sidebar-header">EVENTS</h3>
                <nav className="sidebar-nav">
                    <button
                        className={`sidebar-item ${activeTab === 'tournaments' && !activeTournament ? 'active' : ''}`}
                        onClick={() => { onExitTournament(); setActiveTab('tournaments'); }}
                    >
                        <span className="icon">🏆</span>
                        <span>All Events</span>
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
                        <div className="event-name-label">ACTIVE EVENT</div>
                        <div className="event-name">{activeTournament.name}</div>
                        <nav className="sidebar-nav mt-sm">
                            <button
                                className={`sidebar-item ${activeTab === 'games' ? 'active' : ''}`}
                                onClick={() => setActiveTab('games')}
                            >
                                <span className="icon">📅</span>
                                <span>Game Log</span>
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
                            × Exit Event
                        </button>
                    </div>
                )}
            </div>
        </aside>
    );
}
