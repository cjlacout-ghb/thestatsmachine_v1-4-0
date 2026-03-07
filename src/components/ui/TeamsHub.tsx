import React from 'react';
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
    currentStep?: 1 | 2;
    onStepClick?: (step: number) => void;
}


export function TeamsHub({ teams, tournaments, games, onSelectTeam, onAddTeam, onEditTeam, onDeleteTeam, onDemoData, onImportData, onOpenHelp, currentStep = 1, onStepClick }: TeamsHubProps) {

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        console.log('File selected:', file?.name);
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const content = event.target?.result as string;
                console.log('File read successfully, parsing JSON...');
                const json = JSON.parse(content);
                onImportData(json as AppData);
                // Clear input so same file can be selected again
                if (e.target) e.target.value = '';
            } catch (err) {
                console.error('Import error:', err);
                alert('Formato de archivo JSON inválido.');
            }
        };
        reader.onerror = () => {
            alert('Error al leer el archivo.');
        };
        reader.readAsText(file);
    };

    if (teams.length === 0) {
        return (
            <div className="app-hub">
                <header className="hub-header">
                    <div className="logo">
                        <div className="logo-icon header-logo-icon">🥎</div>
                        <div className="logo-text">
                            <h1>The Stats Machine</h1>
                            <span>v1.4.0</span>
                        </div>
                    </div>
                    <button
                        className="btn btn-ghost btn-sm"
                        onClick={onOpenHelp}
                        style={{ fontWeight: '700', marginLeft: 'auto' }}
                    >
                        📖 Ayuda
                    </button>
                </header>
                <div className="hub-zero-state">
                    <main className="hub-content hub-zero-content">
                        <div className="hero-section" style={{ textAlign: 'center', marginBottom: 'var(--space-2xl)' }}>
                            <div style={{ fontSize: '5rem', marginBottom: 'var(--space-lg)' }}>🥎</div>
                            <h1 className="hero-title hero-title-primary">The Stats Machine</h1>
                            <p className="hero-subtitle hero-subtitle-primary">
                                Análisis Profesional de Rendimiento
                            </p>
                        </div>

                        <div style={{ width: '100%', maxWidth: '600px', marginBottom: 'var(--space-2xl)' }}>
                            <HierarchyStepper currentStep={currentStep} onStepClick={onStepClick} />
                        </div>

                        <div className="card text-center setup-card-primary">
                            <h2 className="setup-card-title">Comenzar</h2>
                            <p className="setup-card-text">
                                Creá tu primera organización de equipo o importá tus datos existentes para comenzar.
                            </p>
                            <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'center' }}>
                                <button
                                    className="btn btn-hero-primary"
                                    onClick={onAddTeam}
                                >
                                    + Agregar Equipo
                                </button>
                                <label className="btn btn-hero-secondary" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    📥 Importar Datos
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
                                or ver datos demo
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
                    <h2 className="hub-title">Mis Equipos</h2>
                    <p className="hub-subtitle">Seleccioná un equipo para gestionar el plantel y seguir el rendimiento en torneos.</p>
                </div>

                <HierarchyStepper currentStep={currentStep} onStepClick={onStepClick} />

                <div className="teams-grid">
                    {teams.map(team => {
                        const teamTournaments = tournaments.filter(t => t.participatingTeamIds?.includes(team.id));
                        const teamGames = games.filter(g => teamTournaments.some(t => t.id === g.tournamentId));

                        return (
                            <div key={team.id} className="team-hub-card">

                                {/* Click overlay — cubre solo el contenido, no los botones */}
                                <div
                                    onClick={() => onSelectTeam(team)}
                                    style={{ position: 'absolute', inset: 0, zIndex: 1, cursor: 'pointer' }}
                                    title={`Seleccionar ${team.name}`}
                                />

                                {/* Sección principal del card — estructura correcta */}
                                <div className="team-card-content">
                                    <div className="team-card-icon">🥎</div>
                                    <div className="team-card-details">
                                        <h3 className="team-name">{team.name}</h3>
                                        <p className="team-desc">{team.description || 'Sin descripción.'}</p>
                                        <div className="team-meta">
                                            <span className="meta-badge">{teamTournaments.length} Eventos</span>
                                            <span className="meta-badge">{teamGames.length} Partidos</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Barra de acciones separada — z-index sobre el overlay */}
                                <div className="team-card-actions-bar">
                                    <div style={{ display: 'flex', gap: '8px', position: 'relative', zIndex: 10 }}>
                                        <button
                                            type="button"
                                            className="btn btn-ghost btn-sm"
                                            onClick={(e) => { e.stopPropagation(); onEditTeam?.(team); }}
                                            title="Editar Equipo"
                                        >
                                            ⚙️ Editar
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn-ghost btn-sm text-danger"
                                            onClick={(e) => { e.stopPropagation(); onDeleteTeam?.(team); }}
                                            title="Eliminar Equipo"
                                        >
                                            🗑 Eliminar
                                        </button>
                                    </div>


                                </div>

                            </div>
                        );
                    })}

                    <div className="team-hub-card add-card" onClick={onAddTeam}>
                        <div className="team-card-content">
                            <div className="team-card-icon">+</div>
                            <div className="team-card-info">
                                <h3 className="team-name">Agregar Equipo</h3>
                                <p className="team-desc">Registrá otro equipo u organización.</p>
                            </div>
                        </div>
                    </div>

                </div>
            </main>
        </div >
    );
}
