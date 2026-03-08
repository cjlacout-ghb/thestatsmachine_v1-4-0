import { useState, useEffect } from 'react';
import type { Game, Player, PlayerGameStats } from '../../types';
import { getMonthStr, getDayStr } from '../../lib/dateUtils';

interface PlayerStatsModalProps {
    game: Game;
    teamName: string;
    players: Player[];
    onSave: (gameId: string, stats: PlayerGameStats[]) => void;
    onCancel: () => void;
}

export function PlayerStatsModal({ game, teamName, players, onSave, onCancel }: PlayerStatsModalProps) {
    const [activeTab, setActiveTab] = useState<'manual' | 'bulk'>('manual');
    const [statsData, setStatsData] = useState<PlayerGameStats[]>([]);
    const [importText, setImportText] = useState('');
    const [importWarning, setImportWarning] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Initialize statsData from game.playerStats or with zeros for all active passing players
    useEffect(() => {
        const initialMap = new Map(game.playerStats?.map(ps => [ps.playerId, ps]));

        const initializedStats = players.map(p => {
            const existing = initialMap.get(p.id);
            if (existing) return existing;

            return {
                playerId: p.id,
                ab: 0, h: 0, doubles: 0, triples: 0, hr: 0, rbi: 0, r: 0, bb: 0, so: 0,
                hbp: 0, sb: 0, cs: 0, sac: 0, sf: 0,
                ip: 0, pH: 0, pR: 0, er: 0, pBB: 0, pSO: 0, pHR: 0, pitchCount: 0,
                po: 0, a: 0, e: 0
            };
        });
        setStatsData(initializedStats);
    }, [game, players]);

    const handleCellChange = (playerId: string, field: keyof PlayerGameStats, value: string) => {
        const numValue = Math.max(0, parseInt(value, 10) || 0);
        setStatsData(prev => prev.map(ps =>
            ps.playerId === playerId ? { ...ps, [field]: numValue } : ps
        ));
    };

    const handleSave = () => {
        setIsSaving(true);
        // Only save stats for players that actually played (e.g. at least 1 AB or 1 IP or registered a stat)
        // For simplicity based on requirements, we save the whole array. We can filter later if needed.
        onSave(game.id, statsData);
        setTimeout(() => {
            setIsSaving(false);
            onCancel(); // Close automatically
        }, 1000);
    };

    const handleParseBulk = () => {
        setImportWarning(null);
        if (!importText.trim()) return;

        const firstLine = importText.split('\n')[0] || '';
        const delimiter = firstLine.includes('\t') ? '\t' : ',';
        const rows = importText.trim().split('\n').map(row => row.split(delimiter).map(cell => cell.trim().replace(/^"|"$/g, '')));

        if (rows.length < 2) {
            setImportWarning("Datos insuficientes. Por favor incluye encabezados y al menos una fila.");
            return;
        }

        const [_headers, ...dataRows] = rows;
        const newStats = [...statsData];
        let missingPlayers: string[] = [];

        for (const cols of dataRows) {
            if (cols.length < 8) continue; // Need at least Name, AB, H, R, RBI, K, BB, E

            const playerName = cols[0].toLowerCase();
            const matchedPlayer = players.find(p => p.name.toLowerCase() === playerName);

            if (!matchedPlayer) {
                missingPlayers.push(cols[0]);
                continue;
            }

            const statIndex = newStats.findIndex(ps => ps.playerId === matchedPlayer.id);
            if (statIndex >= 0) {
                newStats[statIndex] = {
                    ...newStats[statIndex],
                    ab: parseInt(cols[1], 10) || 0,
                    h: parseInt(cols[2], 10) || 0,
                    r: parseInt(cols[3], 10) || 0,
                    rbi: parseInt(cols[4], 10) || 0,
                    so: parseInt(cols[5], 10) || 0, // K = so
                    bb: parseInt(cols[6], 10) || 0,
                    e: parseInt(cols[7], 10) || 0
                };
            }
        }

        setStatsData(newStats);
        setActiveTab('manual');
        setImportText('');

        if (missingPlayers.length > 0) {
            setImportWarning(`Jugadores no encontrados en el plantel y omitidos: ${missingPlayers.join(", ")}`);
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const result = event.target?.result;
            if (typeof result === 'string') {
                setImportText(result);
            }
        };
        reader.readAsText(file);
    };

    const gameTitle = game.homeAway === 'home' ? `${game.opponent} @ ${teamName}` : `${teamName} @ ${game.opponent}`;
    const gameDate = `${getMonthStr(game.date)} ${getDayStr(game.date)}`;

    return (
        <div className="card" style={{ width: '90vw', maxWidth: '800px' }}>
            <div className="modal-header">
                <div>
                    <h2 style={{ margin: 0 }}>Stats Jugadores</h2>
                    <p className="text-muted" style={{ margin: 0, fontSize: '0.85rem' }}>
                        {gameTitle} · {gameDate}
                    </p>
                </div>
            </div>

            <div className="modal-body" style={{ padding: '0' }}>
                <div style={{
                    display: 'flex',
                    gap: 'var(--space-md)',
                    padding: 'var(--space-md) var(--space-xl)',
                    background: 'var(--bg-card-hover)',
                    borderBottom: '1px solid var(--border-light)'
                }}>
                    <button
                        className={`btn ${activeTab === 'manual' ? 'btn-primary' : 'btn-ghost'}`}
                        style={{ flex: 1, fontWeight: 'bold' }}
                        onClick={() => setActiveTab('manual')}
                    >
                        📝 Ingreso Manual
                    </button>
                    <button
                        className={`btn ${activeTab === 'bulk' ? 'btn-primary' : 'btn-ghost'}`}
                        style={{ flex: 1, fontWeight: 'bold' }}
                        onClick={() => setActiveTab('bulk')}
                    >
                        📋 Importación Masiva
                    </button>
                </div>

                <div style={{ padding: 'var(--space-xl)', maxHeight: '60vh', overflowY: 'auto' }}>
                    {activeTab === 'manual' ? (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', minWidth: '600px', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ borderBottom: '2px solid var(--border-light)', textAlign: 'center' }}>
                                        <th style={{ textAlign: 'left', padding: '8px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>Nombre del Jugador</th>
                                        <th style={{ padding: '8px', color: 'var(--text-muted)', fontSize: '0.8rem' }} title="At Bats">AB</th>
                                        <th style={{ padding: '8px', color: 'var(--text-muted)', fontSize: '0.8rem' }} title="Hits">H</th>
                                        <th style={{ padding: '8px', color: 'var(--text-muted)', fontSize: '0.8rem' }} title="Runs">R</th>
                                        <th style={{ padding: '8px', color: 'var(--text-muted)', fontSize: '0.8rem' }} title="Runs Batted In">RBI</th>
                                        <th style={{ padding: '8px', color: 'var(--text-muted)', fontSize: '0.8rem' }} title="Strikeouts">K</th>
                                        <th style={{ padding: '8px', color: 'var(--text-muted)', fontSize: '0.8rem' }} title="Walks">BB</th>
                                        <th style={{ padding: '8px', color: 'var(--text-muted)', fontSize: '0.8rem' }} title="Errors">E</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {players.map(player => {
                                        const stat = statsData.find(s => s.playerId === player.id);
                                        if (!stat) return null;

                                        const inputStyle: React.CSSProperties = {
                                            width: '100%',
                                            minWidth: '40px',
                                            padding: '4px',
                                            textAlign: 'center',
                                            border: '1px solid var(--border-light)',
                                            borderRadius: 'var(--radius-sm)',
                                            fontSize: '0.9rem',
                                            fontFamily: 'monospace'
                                        };

                                        return (
                                            <tr key={player.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                                                <td style={{ padding: '8px', fontWeight: 'bold', fontSize: '0.9rem' }}>{player.name}</td>
                                                <td style={{ padding: '4px' }}><input type="number" min="0" style={inputStyle} value={stat.ab.toString()} onChange={(e) => handleCellChange(player.id, 'ab', e.target.value)} /></td>
                                                <td style={{ padding: '4px' }}><input type="number" min="0" style={inputStyle} value={stat.h.toString()} onChange={(e) => handleCellChange(player.id, 'h', e.target.value)} /></td>
                                                <td style={{ padding: '4px' }}><input type="number" min="0" style={inputStyle} value={stat.r.toString()} onChange={(e) => handleCellChange(player.id, 'r', e.target.value)} /></td>
                                                <td style={{ padding: '4px' }}><input type="number" min="0" style={inputStyle} value={stat.rbi.toString()} onChange={(e) => handleCellChange(player.id, 'rbi', e.target.value)} /></td>
                                                <td style={{ padding: '4px' }}><input type="number" min="0" style={inputStyle} value={stat.so.toString()} onChange={(e) => handleCellChange(player.id, 'so', e.target.value)} /></td>
                                                <td style={{ padding: '4px' }}><input type="number" min="0" style={inputStyle} value={stat.bb.toString()} onChange={(e) => handleCellChange(player.id, 'bb', e.target.value)} /></td>
                                                <td style={{ padding: '4px' }}><input type="number" min="0" style={inputStyle} value={stat.e.toString()} onChange={(e) => handleCellChange(player.id, 'e', e.target.value)} /></td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                            <style>{`
                                input[type=number]::-webkit-inner-spin-button, 
                                input[type=number]::-webkit-outer-spin-button { 
                                    -webkit-appearance: none; 
                                    margin: 0; 
                                }
                                input[type=number] {
                                    -moz-appearance: textfield;
                                }
                            `}</style>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
                            <div className="card dashed-border flex-center" style={{ padding: 'var(--space-xl)', background: 'var(--bg-subtle)' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-sm)' }}>
                                    <div style={{ fontSize: '2rem' }}>📁</div>
                                    <h3 style={{ margin: 0 }}>Subir un archivo .csv o .txt</h3>
                                    <label
                                        className="btn"
                                        style={{
                                            marginTop: 'var(--space-sm)',
                                            cursor: 'pointer',
                                            background: 'var(--bg-secondary)',
                                            border: '1px solid var(--border-color)',
                                            borderRadius: 'var(--radius-md)',
                                            padding: 'var(--space-sm) var(--space-lg)',
                                            fontWeight: '600',
                                            color: 'var(--text-primary)',
                                            boxShadow: 'var(--shadow-sm)',
                                            transition: 'all 0.2s ease'
                                        }}
                                    >
                                        Elegir Archivo
                                        <input
                                            type="file"
                                            accept=".csv,.txt"
                                            onChange={handleFileUpload}
                                            style={{ display: 'none' }}
                                        />
                                    </label>
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                                <div style={{
                                    fontSize: '0.85rem',
                                    color: 'var(--text-muted)',
                                    background: 'var(--bg-subtle)',
                                    border: '1px dashed var(--border-color)',
                                    borderRadius: 'var(--radius-sm)',
                                    padding: 'var(--space-sm)',
                                    marginBottom: 'var(--space-xs)'
                                }}>
                                    <p style={{ margin: '0 0 var(--space-xs) 0', fontWeight: '600', color: 'var(--text-primary)' }}>
                                        Ejemplo de Formato (seleccionable):
                                    </p>
                                    <pre style={{ margin: 0, fontFamily: 'monospace', userSelect: 'all', whiteSpace: 'pre-wrap', cursor: 'text' }}>
                                        Player Name, AB, H, R, RBI, K, BB, E
                                        Jane Doe, 3, 2, 1, 0, 1, 0, 0
                                        John Smith, 4, 1, 0, 0, 2, 1, 0</pre>
                                </div>
                                <h4 style={{ margin: 0 }}>O pegá tus datos aquí</h4>

                                {importWarning && (
                                    <div style={{ padding: 'var(--space-sm)', background: 'var(--under-bg)', color: 'var(--under)', borderRadius: 'var(--radius-sm)', marginBottom: 'var(--space-sm)', fontSize: '0.85rem' }}>
                                        ⚠️ {importWarning}
                                    </div>
                                )}
                                <textarea
                                    className="form-input"
                                    style={{ width: '100%', minHeight: '150px', fontFamily: 'monospace', whiteSpace: 'pre' }}
                                    placeholder="Pegá tus datos CSV o separados por tab aquí..."
                                    value={importText}
                                    onChange={(e) => setImportText(e.target.value)}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <button className="btn btn-ghost" onClick={onCancel}>Cancelar</button>
                {activeTab === 'manual' ? (
                    <button
                        className="btn btn-primary"
                        onClick={handleSave}
                        disabled={isSaving}
                    >
                        {isSaving ? 'Stats guardados ✅' : 'Guardar Stats'}
                    </button>
                ) : (
                    <button
                        className="btn btn-primary"
                        onClick={handleParseBulk}
                        disabled={!importText.trim()}
                    >
                        Parsear & Vista Previa
                    </button>
                )}
            </div>
        </div>
    );
}
