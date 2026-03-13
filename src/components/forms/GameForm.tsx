import { useState } from 'react';
import type { Game, Player, PlayerGameStats } from '../../types';
import { generateId } from '../../lib/storage';
import { calcBatting, calcPitching, calcFielding, formatAvg, formatERA, formatWHIP, getAvgLevel, getERALevel, getFldLevel } from '../../lib/calculations';
import { normalizeInnings } from '../../lib/sportsUtils';


interface GameFormProps {
    game?: Game;
    tournamentId: string;
    tournamentName?: string;
    onSave: (game: Game) => void | Promise<void>;
    onCancel: () => void;
    onDelete?: () => void;
    initialDate?: string;
    teamName: string;
    players: Player[];
}

export function GameForm({ game, tournamentId, tournamentName, onSave, onCancel, onDelete, initialDate, teamName, players }: GameFormProps) {
    const [activeSubTab, setActiveSubTab] = useState<'details' | 'stats'>('details');
    const [date, setDate] = useState(game?.date || initialDate || new Date().toISOString().split('T')[0]);
    const [opponent, setOpponent] = useState(game?.opponent || '');
    const [homeAway, setHomeAway] = useState<Game['homeAway']>(game?.homeAway || 'home');
    const [gameType, setGameType] = useState<Game['gameType']>(game?.gameType || 'regular');
    const [teamScore, setTeamScore] = useState(game?.teamScore ?? 0);
    const [opponentScore, setOpponentScore] = useState(game?.opponentScore ?? 0);
    const [teamInnings, setTeamInnings] = useState(game?.inningsPlayed ?? 7.0);
    const [opponentInnings, setOpponentInnings] = useState(game?.opponentInningsPlayed ?? 7.0);
    const [condition, setCondition] = useState<Game['condition']>(game?.condition || 'REGULAR');
    const [playerStats, setPlayerStats] = useState<PlayerGameStats[]>(game?.playerStats || []);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSaving, setIsSaving] = useState(false);

    const validate = () => {
        const errs: Record<string, string> = {};
        if (!opponent.trim()) errs.opponent = 'El rival es obligatorio';
        if (!date) errs.date = 'La fecha es obligatoria';
        if (teamInnings <= 0) errs.teamInnings = 'Los innings del equipo deben ser mayores a 0';
        if (opponentInnings <= 0) errs.opponentInnings = 'Los innings del rival deben ser mayores a 0';

        const invalidPlayers = playerStats.filter(p => p.h > p.ab).map(p => players.find(pl => pl.id === p.playerId)?.name || 'Unknown Player');
        if (invalidPlayers.length > 0) {
            errs.playerStats = `Los hits no pueden superar los turnos al bate para: ${invalidPlayers.join(', ')}`;
        }

        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!validate()) return;
        
        setIsSaving(true);
        try {
            await onSave({
                id: game?.id || generateId(),
                tournamentId,
                date,
                teamName: game?.teamName || teamName, // Persist or set naming
                opponent: opponent.trim(),
                homeAway,
                gameType,
                condition,
                teamScore,
                opponentScore,
                inningsPlayed: teamInnings,
                opponentInningsPlayed: opponentInnings,
                playerStats: playerStats
            });
        } catch (error) {
            console.error('Error saving game:', error);
            setErrors({ submit: 'Error al intentar guardar el partido. Por favor intenta de nuevo.' });
        } finally {
            setIsSaving(false);
        }
    };

    const updatePlayerStat = (playerId: string, field: keyof PlayerGameStats, value: number) => {
        setPlayerStats(prev => {
            const existing = prev.find(ps => ps.playerId === playerId);
            if (existing) {
                return prev.map(ps => ps.playerId === playerId ? { ...ps, [field]: value } : ps);
            } else {
                // Create default entry if not exists
                const newEntry: PlayerGameStats = {
                    playerId,
                    ab: 0, h: 0, doubles: 0, triples: 0, hr: 0, rbi: 0, r: 0, bb: 0, so: 0, hbp: 0, sb: 0, cs: 0, sac: 0, sf: 0,
                    ip: 0, pH: 0, pR: 0, er: 0, pBB: 0, pSO: 0, pHR: 0, pitchCount: 0,
                    po: 0, a: 0, e: 0
                };
                return [...prev, { ...newEntry, [field]: value }];
            }
        });
    };

    const getPlayerStat = (playerId: string) => {
        return playerStats.find(ps => ps.playerId === playerId) || {
            playerId,
            ab: 0, h: 0, doubles: 0, triples: 0, hr: 0, rbi: 0, r: 0, bb: 0, so: 0, hbp: 0, sb: 0, cs: 0, sac: 0, sf: 0,
            ip: 0, pH: 0, pR: 0, er: 0, pBB: 0, pSO: 0, pHR: 0, pitchCount: 0,
            po: 0, a: 0, e: 0
        };
    };

    // Computed once per render (not per row)
    const hasCatcherOnTeam = players.some(p => p.primaryPosition === 'C');

    return (
        <div className="modal-content" style={{ maxWidth: activeSubTab === 'stats' ? '1200px' : '600px', width: '95vw', transition: 'max-width 0.3s ease' }}>
            <div className="modal-header">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <div>
                        <span className="modal-super-title">
                            {teamName}
                        </span>
                        {tournamentName && (
                            <span style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, opacity: 0.75, marginBottom: '2px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                                {tournamentName}
                            </span>
                        )}
                        <h3 style={{ margin: 0 }}>{game ? 'Editar' : '+ Agregar Nuevo'} Partido</h3>
                    </div>
                    {game && (
                        <div className="tab-switcher" style={{ display: 'flex', background: 'var(--bg-primary)', padding: '4px', borderRadius: 'var(--radius-md)' }}>
                            <button
                                className={`btn btn-sm ${activeSubTab === 'details' ? 'btn-primary' : 'btn-ghost'}`}
                                onClick={() => setActiveSubTab('details')}
                                style={{ borderRadius: 'var(--radius-sm)' }}
                            >Detalles</button>
                            <button
                                className={`btn btn-sm ${activeSubTab === 'stats' ? 'btn-primary' : 'btn-ghost'}`}
                                onClick={() => setActiveSubTab('stats')}
                                style={{ borderRadius: 'var(--radius-sm)' }}
                            >Stats Jugadores</button>
                        </div>
                    )}
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="modal-body">
                    {Object.keys(errors).length > 0 && (
                        <div className="mb-md form-error" style={{ 
                            background: 'color-mix(in srgb, var(--danger-color) 10%, transparent)',
                            border: '1px solid var(--danger-color)',
                            padding: '12px',
                            borderRadius: 'var(--radius-md)',
                            color: 'var(--danger-color)',
                            fontSize: '0.9rem',
                            fontWeight: '600'
                        }}>
                            ⚠️ Por favor corregí lo siguiente: {Object.values(errors).join(', ')}
                        </div>
                    )}

                    {activeSubTab === 'details' ? (
                        <>
                            {/* Meta Data Section */}
                            <div className="form-group mb-lg">
                                <h4 className="form-label mb-md">
                                    Detalles del Partido
                                </h4>
                                <div className="grid-2">
                                    <div className="form-group">
                                        <label className="form-label">Fecha del Partido</label>
                                        <input type="date" className="form-control" value={date} onChange={e => setDate(e.target.value)} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Rival</label>
                                        <input type="text" className="form-control" placeholder="Nombre del Rival" value={opponent} onChange={e => setOpponent(e.target.value)} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Tipo de Partido</label>
                                        <select
                                            className="form-control"
                                            value={gameType}
                                            onChange={e => setGameType(e.target.value as Game['gameType'])}
                                        >
                                            <option value="regular">temporada regular</option>
                                            <option value="playoff">playoff</option>
                                            <option value="tournament">torneo</option>
                                            <option value="friendly">amistoso</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Condición del Juego</label>
                                        <select
                                            className="form-control"
                                            value={condition}
                                            onChange={e => setCondition(e.target.value as Game['condition'])}
                                        >
                                            <option value="REGULAR">regular</option>
                                            <option value="EXTRA INNINGS">extra innings</option>
                                            <option value="RUN-AHEAD RULE">diferencia de carreras</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Local / Visitante</label>
                                        <div style={{ display: 'flex', background: 'var(--bg-primary)', padding: '4px', borderRadius: 'var(--radius-md)' }}>
                                            <button
                                                type="button"
                                                className="btn"
                                                style={{ flex: 1, background: homeAway === 'home' ? 'white' : 'transparent', boxShadow: homeAway === 'home' ? 'var(--shadow-sm)' : 'none', color: homeAway === 'home' ? 'var(--accent-primary)' : 'var(--text-muted)', padding: '8px' }}
                                                onClick={() => setHomeAway('home')}
                                            >Local</button>
                                            <button
                                                type="button"
                                                className="btn"
                                                style={{ flex: 1, background: homeAway === 'away' ? 'white' : 'transparent', boxShadow: homeAway === 'away' ? 'var(--shadow-sm)' : 'none', color: homeAway === 'away' ? 'var(--accent-primary)' : 'var(--text-muted)', padding: '8px' }}
                                                onClick={() => setHomeAway('away')}
                                            >Visitante</button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        <div className="divider"></div>

                        {/* Score Section */}
                        <div className="form-group">
                            <h4 className="form-label mb-md">
                                Marcador Final
                            </h4>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-lg)' }}>
                                {/* AWAY TEAM (LEFT) */}
                                <div style={{
                                    background: (homeAway === 'away') ? 'var(--accent-soft)' : 'var(--bg-primary)',
                                    padding: 'var(--space-lg)',
                                    borderRadius: 'var(--radius-md)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    minHeight: '140px',
                                    border: (homeAway === 'away') ? '1px solid var(--accent-primary)' : '1px solid transparent',
                                    transition: 'all 0.2s ease'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-sm)' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span className="text-bold text-sm" style={{
                                                color: (homeAway === 'away') ? 'var(--accent-primary)' : 'var(--text-secondary)',
                                                textTransform: 'uppercase',
                                                lineHeight: '1.2',
                                                fontSize: (homeAway === 'away') ? '0.8rem' : '0.75rem'
                                            }}>{homeAway === 'home' ? (opponent || 'RIVAL') : teamName}</span>
                                            <span style={{ fontSize: '0.65rem', fontWeight: '800', opacity: 0.5 }}>VISITANTE</span>
                                        </div>
                                    </div>
                                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <input
                                            type="number"
                                            value={homeAway === 'home' ? opponentScore : teamScore}
                                            onChange={e => {
                                                const val = parseInt(e.target.value) || 0;
                                                if (homeAway === 'home') setOpponentScore(val);
                                                else setTeamScore(val);
                                            }}
                                            className="text-center text-bold"
                                            style={{
                                                width: '100%',
                                                background: 'transparent',
                                                border: 'none',
                                                fontSize: '3.5rem',
                                                color: 'var(--text-primary)',
                                                outline: 'none',
                                                padding: '0',
                                                marginTop: '4px'
                                            }}
                                        />
                                    </div>
                                    <div style={{ marginTop: 'auto', paddingTop: 'var(--space-md)', borderTop: '1px solid var(--border-light)', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ fontSize: '0.65rem', fontWeight: '800', color: 'var(--text-muted)' }}>INN JUGADOS</span>
                                        <input
                                            type="number"
                                            step="0.1"
                                            value={homeAway === 'home' ? opponentInnings : teamInnings}
                                            onChange={e => {
                                                const val = normalizeInnings(parseFloat(e.target.value) || 0);
                                                if (homeAway === 'home') setOpponentInnings(val);
                                                else setTeamInnings(val);
                                            }}
                                            className="form-control text-center"
                                            style={{ width: '50px', padding: '2px', fontSize: '0.85rem' }}
                                        />
                                    </div>
                                </div>

                                {/* HOME TEAM (RIGHT) */}
                                <div style={{
                                    background: (homeAway === 'home') ? 'var(--accent-soft)' : 'var(--bg-primary)',
                                    padding: 'var(--space-lg)',
                                    borderRadius: 'var(--radius-md)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    minHeight: '140px',
                                    border: (homeAway === 'home') ? '1px solid var(--accent-primary)' : '1px solid transparent',
                                    transition: 'all 0.2s ease'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-sm)' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span className="text-bold text-sm" style={{
                                                color: (homeAway === 'home') ? 'var(--accent-primary)' : 'var(--text-secondary)',
                                                textTransform: 'uppercase',
                                                lineHeight: '1.2',
                                                fontSize: (homeAway === 'home') ? '0.8rem' : '0.75rem'
                                            }}>{homeAway === 'home' ? teamName : (opponent || 'RIVAL')}</span>
                                            <span style={{
                                                fontSize: '0.65rem',
                                                fontWeight: '800',
                                                color: (homeAway === 'home') ? 'var(--accent-primary)' : 'inherit',
                                                opacity: (homeAway === 'home') ? 1 : 0.5
                                            }}>LOCAL</span>
                                        </div>
                                    </div>
                                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <input
                                            type="number"
                                            value={homeAway === 'home' ? teamScore : opponentScore}
                                            onChange={e => {
                                                const val = parseInt(e.target.value) || 0;
                                                if (homeAway === 'home') setTeamScore(val);
                                                else setOpponentScore(val);
                                            }}
                                            className="text-center text-bold"
                                            style={{
                                                width: '100%',
                                                background: 'transparent',
                                                border: 'none',
                                                fontSize: '3.5rem',
                                                color: 'var(--text-primary)',
                                                outline: 'none',
                                                padding: '0',
                                                marginTop: '4px'
                                            }}
                                        />
                                    </div>
                                    <div style={{ marginTop: 'auto', paddingTop: 'var(--space-md)', borderTop: '1px solid var(--border-light)', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ fontSize: '0.65rem', fontWeight: '800', color: 'var(--text-muted)' }}>INN JUGADOS</span>
                                        <input
                                            type="number"
                                            step="0.1"
                                            value={homeAway === 'home' ? teamInnings : opponentInnings}
                                            onChange={e => {
                                                const val = normalizeInnings(parseFloat(e.target.value) || 0);
                                                if (homeAway === 'home') setTeamInnings(val);
                                                else setOpponentInnings(val);
                                            }}
                                            className="form-control text-center"
                                            style={{ width: '50px', padding: '2px', fontSize: '0.85rem' }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="stats-entry-container">
                        <div style={{ overflowX: 'auto' }}>
                            <table className="stat-table" style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 2px', fontSize: '0.8rem' }}>
                                <thead>
                                    {/* Section Header Row */}
                                    <tr>
                                        <th rowSpan={2} style={{ textAlign: 'left', padding: '10px 12px', verticalAlign: 'bottom', minWidth: '130px' }}>Player</th>
                                        {/* BATTING GROUP */}
                                        <th colSpan={11} style={{ textAlign: 'center', padding: '4px 8px', background: 'color-mix(in srgb, var(--accent-primary) 8%, transparent)', color: 'var(--accent-primary)', fontSize: '0.65rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.08em', borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0' }}>
                                            🥎 Batting
                                        </th>
                                        {/* PITCHING GROUP */}
                                        <th colSpan={10} style={{ textAlign: 'center', padding: '4px 8px', background: 'color-mix(in srgb, #f59e0b 8%, transparent)', color: '#d97706', fontSize: '0.65rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.08em', borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0' }}>
                                            ⚾ Pitching
                                        </th>
                                        {/* FIELDING GROUP */}
                                        <th colSpan={players.some(p => p.primaryPosition === 'C') ? 7 : 4} style={{ textAlign: 'center', padding: '4px 8px', background: 'color-mix(in srgb, #10b981 8%, transparent)', color: '#059669', fontSize: '0.65rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.08em', borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0' }}>
                                            🧤 Fielding
                                        </th>
                                    </tr>
                                    {/* Column Labels Row */}
                                    <tr>
                                        {/* Batting columns */}
                                        <th title="At Bats">AB</th>
                                        <th title="Hits">H</th>
                                        <th title="Doubles">2B</th>
                                        <th title="Triples">3B</th>
                                        <th title="Home Runs">HR</th>
                                        <th title="Walks">BB</th>
                                        <th title="Hit By Pitch">HBP</th>
                                        <th title="Sacrifice Fly (Does not count toward AB)">SF</th>
                                        <th title="Sacrifice Bunt (Does not count toward AB)">SAC</th>
                                        <th title="Runs Batted In">RBI</th>
                                        <th title="Runs Scored">R</th>
                                        {/* Batting computed */}
                                        <th title="Batting Average" style={{ color: 'var(--accent-primary)', borderLeft: '1px solid var(--border-light)' }}>AVG</th>
                                        <th title="On-Base Percentage" style={{ color: 'var(--accent-primary)' }}>OBP</th>
                                        {/* Pitching columns */}
                                        <th title="Innings Pitched" style={{ borderLeft: '2px solid var(--border-color)' }}>IP</th>
                                        <th title="Hits Allowed">H</th>
                                        <th title="Runs Allowed">R</th>
                                        <th title="Earned Runs">ER</th>
                                        <th title="Walks Issued">BB</th>
                                        <th title="Strikeouts">SO</th>
                                        <th title="Home Runs Allowed">HR</th>
                                        <th title="Pitch Count">PC</th>
                                        {/* Pitching computed */}
                                        <th title="Earned Run Average" style={{ color: '#d97706', borderLeft: '1px solid var(--border-light)' }}>ERA</th>
                                        <th title="Walks + Hits per Inning Pitched" style={{ color: '#d97706' }}>WHIP</th>
                                        {/* Fielding columns */}
                                        <th title="Put Outs" style={{ borderLeft: '2px solid var(--border-color)' }}>PO</th>
                                        <th title="Assists">A</th>
                                        <th title="Errors">E</th>
                                        {/* Fielding computed */}
                                        <th title="Fielding Percentage" style={{ color: '#059669', borderLeft: '1px solid var(--border-light)' }}>FLD%</th>
                                        {/* Catcher columns — only if any catcher on team */}
                                        {players.some(p => p.primaryPosition === 'C') && (
                                            <>
                                                <th title="Caught Stealing" style={{ borderLeft: '1px solid var(--border-light)', color: '#059669' }}>CS</th>
                                                <th title="Stolen Bases Allowed" style={{ color: '#059669' }}>SB</th>
                                                <th title="Pick Offs" style={{ color: '#059669' }}>PK</th>
                                                <th title="Passed Balls" style={{ color: '#059669' }}>PB</th>
                                            </>
                                        )}
                                    </tr>
                                </thead>
                                <tbody>
                                    {players.map(player => {
                                        const stats = getPlayerStat(player.id);
                                        const calcBat = calcBatting(stats);
                                        const calcPitch = calcPitching(stats);
                                        const calcField = calcFielding(stats);
                                        const isCatcher = player.primaryPosition === 'C';

                                        const cellStyle: React.CSSProperties = { padding: '4px 2px' };
                                        const inputStyle: React.CSSProperties = { width: '42px', padding: '3px', fontSize: '0.8rem' };
                                        const wideInputStyle: React.CSSProperties = { width: '52px', padding: '3px', fontSize: '0.8rem' };

                                        return (
                                            <tr key={player.id} style={{ background: 'var(--bg-primary)' }}>
                                                {/* Player name */}
                                                <td style={{ padding: '8px 10px', borderTopLeftRadius: 'var(--radius-sm)', borderBottomLeftRadius: 'var(--radius-sm)' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                        <span style={{ fontSize: '0.7rem', fontWeight: '800', color: 'var(--text-muted)', minWidth: '22px' }}>#{player.jerseyNumber}</span>
                                                        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
                                                            <span className="text-bold" style={{ fontSize: '0.8rem' }}>{player.name}</span>
                                                            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: '700' }}>{player.primaryPosition}</span>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* BATTING INPUTS */}
                                                <td style={cellStyle}><input type="number" className="form-control text-center input-sm" style={{ ...inputStyle, border: stats.h > stats.ab ? '1px solid var(--danger-color)' : undefined }} value={stats.ab} onChange={e => updatePlayerStat(player.id, 'ab', parseInt(e.target.value) || 0)} /></td>
                                                <td style={cellStyle}><input type="number" className="form-control text-center input-sm" style={{ ...inputStyle, border: stats.h > stats.ab ? '1px solid var(--danger-color)' : undefined }} value={stats.h} onChange={e => updatePlayerStat(player.id, 'h', parseInt(e.target.value) || 0)} /></td>
                                                <td style={cellStyle}><input type="number" className="form-control text-center input-sm" style={inputStyle} value={stats.doubles} onChange={e => updatePlayerStat(player.id, 'doubles', parseInt(e.target.value) || 0)} /></td>
                                                <td style={cellStyle}><input type="number" className="form-control text-center input-sm" style={inputStyle} value={stats.triples} onChange={e => updatePlayerStat(player.id, 'triples', parseInt(e.target.value) || 0)} /></td>
                                                <td style={cellStyle}><input type="number" className="form-control text-center input-sm" style={inputStyle} value={stats.hr} onChange={e => updatePlayerStat(player.id, 'hr', parseInt(e.target.value) || 0)} /></td>
                                                <td style={cellStyle}><input type="number" className="form-control text-center input-sm" style={inputStyle} value={stats.bb} onChange={e => updatePlayerStat(player.id, 'bb', parseInt(e.target.value) || 0)} /></td>
                                                <td style={cellStyle}><input type="number" className="form-control text-center input-sm" style={inputStyle} value={stats.hbp} onChange={e => updatePlayerStat(player.id, 'hbp', parseInt(e.target.value) || 0)} /></td>
                                                <td style={cellStyle}><input type="number" className="form-control text-center input-sm" style={inputStyle} value={stats.sf} onChange={e => updatePlayerStat(player.id, 'sf', parseInt(e.target.value) || 0)} /></td>
                                                <td style={cellStyle}><input type="number" className="form-control text-center input-sm" style={inputStyle} value={stats.sac} onChange={e => updatePlayerStat(player.id, 'sac', parseInt(e.target.value) || 0)} /></td>
                                                <td style={cellStyle}><input type="number" className="form-control text-center input-sm" style={inputStyle} value={stats.rbi} onChange={e => updatePlayerStat(player.id, 'rbi', parseInt(e.target.value) || 0)} /></td>
                                                <td style={cellStyle}><input type="number" className="form-control text-center input-sm" style={inputStyle} value={stats.r} onChange={e => updatePlayerStat(player.id, 'r', parseInt(e.target.value) || 0)} /></td>

                                                {/* BATTING COMPUTED */}
                                                <td style={{ ...cellStyle, borderLeft: '1px solid var(--border-light)', paddingLeft: '8px' }}>
                                                    <span className={`text-mono text-bold ${getAvgLevel(calcBat.avg)}`} style={{ fontSize: '0.8rem' }}>{formatAvg(calcBat.avg)}</span>
                                                </td>
                                                <td style={cellStyle}>
                                                    <span className="text-mono text-muted" style={{ fontSize: '0.8rem' }}>{formatAvg(calcBat.obp)}</span>
                                                </td>

                                                {/* PITCHING INPUTS */}
                                                <td style={{ ...cellStyle, borderLeft: '2px solid var(--border-color)', paddingLeft: '8px' }}>
                                                    <input type="number" step="0.1" className="form-control text-center input-sm" style={wideInputStyle} value={stats.ip}
                                                        onChange={e => updatePlayerStat(player.id, 'ip', normalizeInnings(parseFloat(e.target.value) || 0))} />
                                                </td>
                                                <td style={cellStyle}><input type="number" className="form-control text-center input-sm" style={inputStyle} value={stats.pH} onChange={e => updatePlayerStat(player.id, 'pH', parseInt(e.target.value) || 0)} /></td>
                                                <td style={cellStyle}><input type="number" className="form-control text-center input-sm" style={inputStyle} value={stats.pR} onChange={e => updatePlayerStat(player.id, 'pR', parseInt(e.target.value) || 0)} /></td>
                                                <td style={cellStyle}><input type="number" className="form-control text-center input-sm" style={inputStyle} value={stats.er} onChange={e => updatePlayerStat(player.id, 'er', parseInt(e.target.value) || 0)} /></td>
                                                <td style={cellStyle}><input type="number" className="form-control text-center input-sm" style={inputStyle} value={stats.pBB} onChange={e => updatePlayerStat(player.id, 'pBB', parseInt(e.target.value) || 0)} /></td>
                                                <td style={cellStyle}><input type="number" className="form-control text-center input-sm" style={inputStyle} value={stats.pSO} onChange={e => updatePlayerStat(player.id, 'pSO', parseInt(e.target.value) || 0)} /></td>
                                                <td style={cellStyle}><input type="number" className="form-control text-center input-sm" style={inputStyle} value={stats.pHR} onChange={e => updatePlayerStat(player.id, 'pHR', parseInt(e.target.value) || 0)} /></td>
                                                <td style={cellStyle}><input type="number" className="form-control text-center input-sm" style={wideInputStyle} value={stats.pitchCount} onChange={e => updatePlayerStat(player.id, 'pitchCount', parseInt(e.target.value) || 0)} /></td>

                                                {/* PITCHING COMPUTED */}
                                                <td style={{ ...cellStyle, borderLeft: '1px solid var(--border-light)', paddingLeft: '8px' }}>
                                                    {stats.ip > 0
                                                        ? <span className={`text-mono text-bold ${getERALevel(calcPitch.era)}`} style={{ fontSize: '0.8rem' }}>{formatERA(calcPitch.era)}</span>
                                                        : <span className="text-muted" style={{ fontSize: '0.75rem' }}>—</span>
                                                    }
                                                </td>
                                                <td style={cellStyle}>
                                                    {stats.ip > 0
                                                        ? <span className="text-mono" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{formatWHIP(calcPitch.whip)}</span>
                                                        : <span className="text-muted" style={{ fontSize: '0.75rem' }}>—</span>
                                                    }
                                                </td>

                                                {/* FIELDING INPUTS */}
                                                <td style={{ ...cellStyle, borderLeft: '2px solid var(--border-color)', paddingLeft: '8px' }}>
                                                    <input type="number" className="form-control text-center input-sm" style={inputStyle} value={stats.po} onChange={e => updatePlayerStat(player.id, 'po', parseInt(e.target.value) || 0)} />
                                                </td>
                                                <td style={cellStyle}><input type="number" className="form-control text-center input-sm" style={inputStyle} value={stats.a} onChange={e => updatePlayerStat(player.id, 'a', parseInt(e.target.value) || 0)} /></td>
                                                <td style={cellStyle}><input type="number" className="form-control text-center input-sm" style={inputStyle} value={stats.e} onChange={e => updatePlayerStat(player.id, 'e', parseInt(e.target.value) || 0)} /></td>

                                                {/* FIELDING COMPUTED */}
                                                <td style={{ ...cellStyle, borderLeft: '1px solid var(--border-light)', paddingLeft: '8px', borderTopRightRadius: hasCatcherOnTeam ? 0 : 'var(--radius-sm)', borderBottomRightRadius: hasCatcherOnTeam ? 0 : 'var(--radius-sm)' }}>
                                                    {(stats.po + stats.a + stats.e) > 0
                                                        ? <span className={`text-mono text-bold ${getFldLevel(calcField.fldPct)}`} style={{ fontSize: '0.8rem' }}>{formatAvg(calcField.fldPct)}</span>
                                                        : <span className="text-muted" style={{ fontSize: '0.75rem' }}>—</span>
                                                    }
                                                </td>

                                                {/* CATCHER COLUMNS — only rendered if any catcher on team */}
                                                {hasCatcherOnTeam && (
                                                    <>
                                                        <td style={{ ...cellStyle, borderLeft: '1px solid var(--border-light)' }}>
                                                            {isCatcher
                                                                ? <input type="number" className="form-control text-center input-sm" style={inputStyle} value={stats.cCS ?? 0} onChange={e => updatePlayerStat(player.id, 'cCS', parseInt(e.target.value) || 0)} />
                                                                : <span className="text-muted" style={{ fontSize: '0.75rem' }}>—</span>
                                                            }
                                                        </td>
                                                        <td style={cellStyle}>
                                                            {isCatcher
                                                                ? <input type="number" className="form-control text-center input-sm" style={inputStyle} value={stats.cSB ?? 0} onChange={e => updatePlayerStat(player.id, 'cSB', parseInt(e.target.value) || 0)} />
                                                                : <span className="text-muted" style={{ fontSize: '0.75rem' }}>—</span>
                                                            }
                                                        </td>
                                                        <td style={cellStyle}>
                                                            {isCatcher
                                                                ? <input type="number" className="form-control text-center input-sm" style={inputStyle} value={stats.pk ?? 0} onChange={e => updatePlayerStat(player.id, 'pk', parseInt(e.target.value) || 0)} />
                                                                : <span className="text-muted" style={{ fontSize: '0.75rem' }}>—</span>
                                                            }
                                                        </td>
                                                        <td style={{ ...cellStyle, borderTopRightRadius: 'var(--radius-sm)', borderBottomRightRadius: 'var(--radius-sm)' }}>
                                                            {isCatcher
                                                                ? <input type="number" className="form-control text-center input-sm" style={inputStyle} value={stats.pb ?? 0} onChange={e => updatePlayerStat(player.id, 'pb', parseInt(e.target.value) || 0)} />
                                                                : <span className="text-muted" style={{ fontSize: '0.75rem' }}>—</span>
                                                            }
                                                        </td>
                                                    </>
                                                )}
                                            </tr>
                                        );
                                    })
                                    }
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            <div className="modal-footer">
                {game && onDelete && (
                    <button type="button" className="btn btn-danger" onClick={onDelete} style={{ marginRight: 'auto' }}>
                        🗑 Eliminar
                    </button>
                )}
                <button type="button" className="btn btn-secondary" onClick={onCancel} style={{ flex: 1 }} disabled={isSaving}>Cancelar</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={isSaving}>
                    {isSaving ? 'Guardando...' : 'Guardar Cambios del Partido'}
                </button>
            </div>
            </form>
        </div>
    );
}
