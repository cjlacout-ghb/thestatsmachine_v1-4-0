import type { AppData, Team, Tournament, Game } from '../../types';
import { HierarchyStepper } from './HierarchyStepper';

interface TeamsHubProps {
    teams: Team[];
    tournaments: Tournament[];
    games: Game[];
    onSelectTeam: (team: Team) => void;
    onAddTeam: () => void;
    onEditTeam?: (team: Team) => void;
    onDeleteTeam?: (team: Team) => void;
    onDemoData?: () => void;
    onImportData: (data: AppData) => void;
    onOpenHelp: () => void;
}


export function TeamsHub({ teams, tournaments, games, onSelectTeam, onAddTeam, onEditTeam, onDeleteTeam, onDemoData, onImportData, onOpenHelp: _onOpenHelp }: TeamsHubProps) {

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const content = event.target?.result as string;
                const json = JSON.parse(content);
                onImportData(json as AppData);
                // Clear input so same file can be selected again
                if (e.target) e.target.value = '';
            } catch (err) {
                console.error('Import error:', err);
                alert('Invalid JSON file format.');
            }
        };
        reader.onerror = () => {
            alert('Error reading file.');
        };
        reader.readAsText(file);
    };

    if (teams.length === 0) {
        return (
            <div className="app-hub">
                <div className="hub-zero-state">
                    <main className="hub-content hub-zero-content">
                        <div className="hero-section" style={{ textAlign: 'center', marginBottom: 'var(--space-2xl)' }}>
                            <div style={{ fontSize: '5rem', marginBottom: 'var(--space-lg)' }}>🥎</div>
                            <h1 className="hero-title hero-title-primary">The Stats Machine</h1>
                            <p className="hero-subtitle hero-subtitle-primary">
                                Professional Analytics & Performance Tracking
                            </p>
                        </div>

                        <div style={{ width: '100%', maxWidth: '600px', marginBottom: 'var(--space-2xl)' }}>
                            <HierarchyStepper currentStep={1} />
                        </div>

                        <div className="card text-center setup-card-primary">
                            <h2 className="setup-card-title">Get Started</h2>
                            <p className="setup-card-text">
                                Create your first team organization or import your existing data to begin.
                            </p>
                            <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'center' }}>
                                <button
                                    className="btn btn-hero-primary"
                                    onClick={onAddTeam}
                                >
                                    + Add Team
                                </button>
                                <label className="btn btn-hero-secondary" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    📥 Import Data
                                    <input
                                        type="file"
                                        accept=".json"
                                        style={{ display: 'none' }}
                                        onChange={handleFileChange}
                                    />
                                </label>
                            </div>
                        </div>

                        {onDemoData && (
                            <button
                                onClick={onDemoData}
                                className="link-demo-data"
                            >
                                or view demo data
                            </button>
                        )}
                    </main>
                </div>
            </div>
        );
    }

    return (
        <div className="app-hub">
            <main className="hub-content">
                <div className="hub-intro">
                    <h2 className="hub-title">My Teams</h2>
                    <p className="hub-subtitle">Select a team to manage rosters and track tournament performance.</p>
                </div>

                <HierarchyStepper currentStep={1} />

                <div className="teams-grid">
                    {teams.map(team => {
                        const teamTournaments = tournaments.filter(t => t.participatingTeamIds?.includes(team.id));
                        const teamGames = games.filter(g => teamTournaments.some(t => t.id === g.tournamentId));

                        return (
                            <div key={team.id} className="team-hub-card" style={{ position: 'relative' }}>
                                {/* Click Overlay for Selection */}
                                <div
                                    onClick={() => onSelectTeam(team)}
                                    style={{
                                        position: 'absolute',
                                        inset: 0,
                                        zIndex: 2,
                                        cursor: 'pointer'
                                    }}
                                    title={`Select ${team.name}`}
                                />

                                <div className="team-card-icon" style={{ zIndex: 1 }}>🥎</div>
                                <div className="team-card-info" style={{ zIndex: 1 }}>
                                    <h3 className="team-name">{team.name}</h3>
                                    <p className="team-desc">{team.description || 'No description provided.'}</p>
                                    <div className="team-meta">
                                        <span className="meta-badge">{teamTournaments.length} Tournaments</span>
                                        <span className="meta-badge">{teamGames.length} Games</span>
                                    </div>
                                    <div className="team-actions" style={{ display: 'flex', gap: '8px', marginTop: '12px', position: 'relative', zIndex: 10 }}>
                                        <button
                                            type="button"
                                            className="btn btn-ghost btn-sm"
                                            onClick={(e) => {
                                                // Event is naturally isolated due to z-index layering, 
                                                // but we keep these for safety.
                                                e.stopPropagation();
                                                onEditTeam?.(team);
                                            }}
                                            title="Edit Team"
                                            style={{ fontSize: '0.8rem', padding: '4px 8px', pointerEvents: 'auto' }}
                                        >
                                            ⚙️ Edit
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn-ghost btn-sm text-danger"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (onDeleteTeam) onDeleteTeam(team);
                                            }}
                                            title="Delete Team"
                                            style={{ fontSize: '0.8rem', padding: '4px 8px', pointerEvents: 'auto' }}
                                        >
                                            🗑 Delete
                                        </button>
                                    </div>
                                </div>
                                <div className="team-card-arrow" style={{ zIndex: 1 }}>→</div>
                            </div>
                        );
                    })}

                    <div className="team-hub-card add-card" onClick={onAddTeam}>
                        <div className="team-card-icon">+</div>
                        <div className="team-card-info">
                            <h3 className="team-name">Add Team</h3>
                            <p className="team-desc">Register another squad or organization.</p>
                        </div>
                    </div>

                    <label className="team-hub-card add-card" style={{ cursor: 'pointer', borderColor: 'var(--avg)', color: 'var(--avg)' }}>
                        <div className="team-card-icon">📥</div>
                        <div className="team-card-info">
                            <h3 className="team-name">Import Data</h3>
                            <p className="team-desc">Restore a previously saved session.</p>
                            <input
                                type="file"
                                accept=".json"
                                style={{ display: 'none' }}
                                onChange={handleFileChange}
                            />
                        </div>
                    </label>
                </div>
            </main>
        </div >
    );
}
