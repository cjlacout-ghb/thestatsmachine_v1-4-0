import { useState, useCallback } from 'react';
import { GlobalSearch } from '../ui/GlobalSearch';
import { SoftballLogo } from '../ui/SoftballLogo';
import type { Team, Tournament, Player, Game, AppData } from '../../types';

interface AppHeaderProps {
    activeTeam: Team | null;
    saveStatus: 'saved' | 'saving' | 'unsaved';
    lastSaveTime: Date | null;
    data: AppData;
    filteredPlayers: Player[];
    searchGames: Game[];
    onNavigateSearch: (
        target: { type: 'player', item: Player } | { type: 'game', item: Game, tournament: Tournament }
    ) => void;
    onOpenHelp: () => void;
    onSwitchTeam: () => void;
    onSaveToDisk: () => Promise<boolean>;
    onLoadFromDisk: () => void;
    onOpenErase: () => void;
    hasUnsavedChanges?: boolean;
}

export function AppHeader({
    activeTeam,
    saveStatus,
    lastSaveTime,
    data,
    filteredPlayers,
    searchGames,
    onNavigateSearch,
    onOpenHelp,
    onSwitchTeam,
    onSaveToDisk,
    onLoadFromDisk,
    onOpenErase,
    hasUnsavedChanges = false,
}: AppHeaderProps) {
    const [diskSaveConfirmed, setDiskSaveConfirmed] = useState(false);

    const handleSaveToDisk = useCallback(async () => {
        const saved = await onSaveToDisk();
        if (saved) {
            setDiskSaveConfirmed(true);
            setTimeout(() => setDiskSaveConfirmed(false), 2000);
        }
    }, [onSaveToDisk]);

    return (
        <header className="app-header">
            <div className="header-content">
                {/* Logo / Team Name */}
                <div className="logo" onClick={onSwitchTeam} style={{ cursor: 'pointer' }}>
                    <div className="logo-icon header-logo-icon">
                        <SoftballLogo size={24} />
                    </div>
                    <div className="logo-text">
                        <h1>The Stats Machine</h1>
                        <span>{activeTeam ? activeTeam.name : 'Organization Hub'} • v1.3.0</span>
                    </div>
                </div>

                {/* Global Search (only inside a team) */}
                <nav className="tab-nav">
                    {activeTeam && (
                        <GlobalSearch
                            players={filteredPlayers}
                            games={searchGames}
                            onSelectPlayer={(p) => onNavigateSearch({ type: 'player', item: p })}
                            onSelectGame={(g) => {
                                const t = data.tournaments.find(tour => tour.id === g.tournamentId);
                                if (t) onNavigateSearch({ type: 'game', item: g, tournament: t });
                            }}
                        />
                    )}
                </nav>

                {/* Right-side action cluster */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>

                    {/* Auto-save status pill */}
                    <div
                        className="save-status-indicator"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '6px 12px',
                            background: 'var(--bg-primary)',
                            borderRadius: 'var(--radius-full)',
                            fontSize: '0.75rem',
                            color: 'var(--text-secondary)',
                            border: '1px solid var(--border-light)',
                            whiteSpace: 'nowrap'
                        }}
                        title={lastSaveTime ? `Last auto-save: ${lastSaveTime.toLocaleTimeString()}` : 'Ready'}
                    >
                        <div style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            flexShrink: 0,
                            background: saveStatus === 'saved'
                                ? 'var(--success-color)'
                                : saveStatus === 'saving'
                                    ? 'var(--warning-color)'
                                    : 'var(--danger-color)',
                            boxShadow: saveStatus === 'saved' ? '0 0 8px var(--success-color)' : 'none'
                        }} />
                        <span style={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            {saveStatus === 'saving'
                                ? 'Syncing...'
                                : hasUnsavedChanges
                                    ? <span style={{ color: 'var(--danger-color)' }}>⚠️ Unsaved Data</span>
                                    : lastSaveTime
                                        ? `Saved ${lastSaveTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                                        : 'Ready'}
                        </span>
                    </div>

                    {/* Divider */}
                    <div style={{ width: '1px', height: '20px', background: 'var(--border-light)', flexShrink: 0 }} />

                    {/* 💾 Save to Disk */}
                    <button
                        onClick={handleSaveToDisk}
                        title="Save a backup copy to your computer (Save As dialog)"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '6px 14px',
                            borderRadius: 'var(--radius-full)',
                            fontWeight: 600,
                            fontSize: '0.75rem',
                            letterSpacing: '0.03em',
                            border: diskSaveConfirmed
                                ? '1px solid var(--success-color)'
                                : '1px solid var(--border-light)',
                            background: diskSaveConfirmed ? 'var(--success-color)' : 'var(--bg-subtle)',
                            color: diskSaveConfirmed ? 'white' : 'var(--text-primary)',
                            boxShadow: diskSaveConfirmed ? '0 0 10px var(--success-color)' : 'none',
                            transition: 'all 0.25s ease',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap'
                        }}
                    >
                        {diskSaveConfirmed ? '✅ Saved!' : '💾 Save'}
                    </button>

                    {/* 📥 Load from Disk */}
                    <button
                        onClick={onLoadFromDisk}
                        title="Restore a previously saved backup file"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '6px 14px',
                            borderRadius: 'var(--radius-full)',
                            fontWeight: 600,
                            fontSize: '0.75rem',
                            letterSpacing: '0.03em',
                            border: '1px solid var(--border-light)',
                            background: 'var(--bg-subtle)',
                            color: 'var(--text-primary)',
                            transition: 'all 0.2s ease',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap'
                        }}
                    >
                        📥 Import Data
                    </button>

                    {/* Divider */}
                    <div style={{ width: '1px', height: '20px', background: 'var(--border-light)', flexShrink: 0 }} />

                    {/* Team Switcher */}
                    {activeTeam && (
                        <button
                            className="btn btn-ghost btn-sm"
                            onClick={onSwitchTeam}
                            style={{ fontWeight: 700, whiteSpace: 'nowrap' }}
                        >
                            🔄 Switch Team
                        </button>
                    )}

                    {/* Help */}
                    <button
                        className="btn btn-ghost btn-sm"
                        onClick={onOpenHelp}
                        style={{ fontWeight: 700 }}
                        title="Help & Documentation"
                    >
                        📖 Help
                    </button>

                    {/* ⚠️ Erase — danger icon, intentionally understated */}
                    <button
                        onClick={onOpenErase}
                        title="Erase all data (danger zone)"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '32px',
                            height: '32px',
                            borderRadius: 'var(--radius-full)',
                            border: '1px solid transparent',
                            background: 'transparent',
                            color: 'var(--text-muted)',
                            fontSize: '1rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            flexShrink: 0
                        }}
                        onMouseEnter={e => {
                            (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--danger-color)';
                            (e.currentTarget as HTMLButtonElement).style.color = 'var(--danger-color)';
                            (e.currentTarget as HTMLButtonElement).style.background = 'color-mix(in srgb, var(--danger-color) 10%, transparent)';
                        }}
                        onMouseLeave={e => {
                            (e.currentTarget as HTMLButtonElement).style.borderColor = 'transparent';
                            (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)';
                            (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                        }}
                    >
                        🗑️
                    </button>

                </div>
            </div>
        </header>
    );
}
