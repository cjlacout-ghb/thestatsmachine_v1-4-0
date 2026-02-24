import { GlobalSearch } from '../ui/GlobalSearch';
import type { Team, Tournament, Player, Game, AppData } from '../../types';

interface AppHeaderProps {
    activeTeam: Team | null;
    saveStatus: 'saved' | 'saving' | 'unsaved';
    lastSaveTime: Date | null;
    onOpenStorage: () => void;
    data: AppData;
    filteredPlayers: Player[];
    searchGames: Game[];
    onNavigateSearch: (
        target: { type: 'player', item: Player } | { type: 'game', item: Game, tournament: Tournament }
    ) => void;
    onOpenHelp: () => void;
    onSwitchTeam: () => void;
    onManualSave?: () => void;
}


export function AppHeader({
    activeTeam,
    saveStatus,
    lastSaveTime,
    onOpenStorage,
    data,
    filteredPlayers,
    searchGames,
    onNavigateSearch,
    onOpenHelp,
    onSwitchTeam,
    onManualSave: _onManualSave
}: AppHeaderProps) {
    return (
        <header className="app-header">
            <div className="header-content">
                <div className="logo" onClick={onSwitchTeam} style={{ cursor: 'pointer' }}>
                    <div className="logo-icon">🥎</div>
                    <div className="logo-text">
                        <h1>The Stats Machine</h1>
                        <span>{activeTeam ? activeTeam.name : 'Organization Hub'} • v1.2.0</span>
                    </div>
                </div>

                <nav className="tab-nav">
                    {activeTeam && (
                        <GlobalSearch
                            players={filteredPlayers}
                            games={searchGames}
                            onSelectPlayer={(p) => onNavigateSearch({ type: 'player', item: p })}
                            onSelectGame={(g) => {
                                const t = data.tournaments.find(tour => tour.id === g.tournamentId);
                                if (t) {
                                    onNavigateSearch({ type: 'game', item: g, tournament: t });
                                }
                            }}
                        />
                    )}
                </nav>

                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                    {/* Last Saved Status */}
                    <div className="save-status-indicator"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--space-sm)',
                            padding: '6px 12px',
                            background: 'var(--bg-primary)',
                            borderRadius: 'var(--radius-full)',
                            fontSize: '0.75rem',
                            color: 'var(--text-secondary)',
                            border: '1px solid var(--border-light)'
                        }}
                        title={lastSaveTime ? `Last local sync: ${lastSaveTime.toLocaleTimeString()}` : 'Data persistent in source'}
                    >
                        <div style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: saveStatus === 'saved' ? 'var(--success-color)' : (saveStatus === 'saving' ? 'var(--warning-color)' : 'var(--danger-color)'),
                            boxShadow: saveStatus === 'saved' ? '0 0 8px var(--success-color)' : 'none'
                        }}></div>
                        <span style={{ fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            {saveStatus === 'saving' ? 'Syncing...' : (lastSaveTime ? `Saved ${lastSaveTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Ready')}
                        </span>
                    </div>

                    <button
                        className="btn btn-ghost btn-sm"
                        onClick={onOpenStorage}
                        style={{ padding: '8px', borderRadius: 'var(--radius-full)' }}
                        title="Storage & Backup Settings"
                    >
                        ⚙️
                    </button>

                    {/* Team Switcher Link */}
                    {activeTeam && (
                        <button
                            className="btn btn-ghost btn-sm"
                            onClick={onSwitchTeam}
                            style={{ fontWeight: '700' }}
                        >
                            🔄 Switch Team
                        </button>
                    )}

                    <button
                        className="btn btn-ghost btn-sm"
                        onClick={onOpenHelp}
                        style={{ fontWeight: '700' }}
                        title="Help & Documentation"
                    >
                        📖 Help
                    </button>

                </div>
            </div>
        </header>
    );
}

