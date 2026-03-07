import { useState, useCallback } from 'react';
import type { Team } from '../../types';

interface AppHeaderProps {
    activeTeam: Team | null;
    saveStatus: 'saved' | 'saving' | 'unsaved';
    lastSaveTime: Date | null;
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
                    <div className="logo-icon header-logo-icon">🥎</div>
                    <div className="logo-text">
                        <h1>The Stats Machine</h1>
                        <span>{activeTeam ? activeTeam.name : 'Panel Principal'} • v1.4.0</span>
                    </div>
                </div>



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
                        title={lastSaveTime ? `Último guardado: ${lastSaveTime.toLocaleTimeString()}` : 'Listo'}
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
                                ? 'Sincronizando...'
                                : hasUnsavedChanges
                                    ? <span style={{ color: 'var(--danger-color)' }}>⚠️ Datos sin guardar</span>
                                    : lastSaveTime
                                        ? `Guardado ${lastSaveTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                                        : 'Listo'}
                        </span>
                    </div>

                    {/* Divider */}
                    <div style={{ width: '1px', height: '20px', background: 'var(--border-light)', flexShrink: 0 }} />

                    {/* 💾 Save to Disk */}
                    <button
                        onClick={handleSaveToDisk}
                        title="Guardar una copia de respaldo en tu computadora (cuadro de diálogo Guardar como)"
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
                        {diskSaveConfirmed ? '✅ ¡Guardado!' : '💾 Guardar'}
                    </button>

                    {/* 📥 Load from Disk */}
                    <button
                        onClick={onLoadFromDisk}
                        title="Restaurar un archivo de respaldo guardado previamente"
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
                        📥 Importar Datos
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
                            🔄 Cambiar Equipo
                        </button>
                    )}

                    {/* Help */}
                    <button
                        className="btn btn-ghost btn-sm"
                        onClick={onOpenHelp}
                        style={{ fontWeight: 700 }}
                        title="Ayuda y Documentación"
                    >
                        📖 Ayuda
                    </button>

                    {/* ⚠️ Erase — danger icon, intentionally understated */}
                    <button
                        onClick={onOpenErase}
                        title="Borrar todos los datos (zona de peligro)"
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
