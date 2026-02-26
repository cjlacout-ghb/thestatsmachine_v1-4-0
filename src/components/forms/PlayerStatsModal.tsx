import { useState, useEffect } from 'react';
import type { Game, Player, PlayerGameStats } from '../../types';
import { getMonthStr, getDayStr } from '../../lib/dateUtils';
import { downloadCSVTemplate, downloadTXTTemplate } from '../../lib/fileDownloader';

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
            setImportWarning("Not enough data. Please include headers and at least one row.");
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
            alert(`⚠️ Players not found in roster and skipped:\n${missingPlayers.join(", ")}`);
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
                    <h2 style={{ margin: 0 }}>Player Stats</h2>
                    <p className="text-muted" style={{ margin: 0, fontSize: '0.85rem' }}>
                        {gameTitle} · {gameDate}
                    </p>
                </div>
            </div>

            <div className="modal-body" style={{ padding: '0' }}>
                <div style={{ display: 'flex', borderBottom: '1px solid var(--border-light)', padding: '0 var(--space-xl)' }}>
                    <button
                        className="btn btn-ghost"
                        style={{
                            borderRadius: 0,
                            borderBottom: activeTab === 'manual' ? '2px solid var(--primary-color)' : '2px solid transparent',
                            color: activeTab === 'manual' ? 'var(--text-primary)' : 'var(--text-muted)'
                        }}
                        onClick={() => setActiveTab('manual')}
                    >
                        Manual Entry
                    </button>
                    <button
                        className="btn btn-ghost"
                        style={{
                            borderRadius: 0,
                            borderBottom: activeTab === 'bulk' ? '2px solid var(--primary-color)' : '2px solid transparent',
                            color: activeTab === 'bulk' ? 'var(--text-primary)' : 'var(--text-muted)'
                        }}
                        onClick={() => setActiveTab('bulk')}
                    >
                        Bulk Import
                    </button>
                </div>

                <div style={{ padding: 'var(--space-xl)', maxHeight: '60vh', overflowY: 'auto' }}>
                    {activeTab === 'manual' ? (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', minWidth: '600px', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ borderBottom: '2px solid var(--border-light)', textAlign: 'center' }}>
                                        <th style={{ textAlign: 'left', padding: '8px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>Player Name</th>
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
                                    <h3 style={{ margin: 0 }}>Upload a .csv or .txt file</h3>
                                    <input
                                        type="file"
                                        accept=".csv,.txt"
                                        onChange={handleFileUpload}
                                        style={{ marginTop: 'var(--space-sm)' }}
                                    />
                                    <div style={{ display: 'flex', gap: 'var(--space-md)', marginTop: 'var(--space-md)' }}>
                                        <button
                                            type="button"
                                            className="btn btn-ghost btn-sm"
                                            onClick={downloadCSVTemplate}
                                            style={{ color: 'var(--primary-color)' }}
                                        >
                                            📥 Download Template (.csv)
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn-ghost btn-sm"
                                            onClick={downloadTXTTemplate}
                                            style={{ color: 'var(--primary-color)' }}
                                        >
                                            📥 Download Template (.txt)
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h4 style={{ margin: '0 0 var(--space-sm) 0' }}>Or paste your data here</h4>
                                {importWarning && (
                                    <div style={{ padding: 'var(--space-sm)', background: 'var(--under-bg)', color: 'var(--under)', borderRadius: 'var(--radius-sm)', marginBottom: 'var(--space-sm)', fontSize: '0.85rem' }}>
                                        ⚠️ {importWarning}
                                    </div>
                                )}
                                <textarea
                                    className="form-input"
                                    style={{ width: '100%', minHeight: '150px', fontFamily: 'monospace', whiteSpace: 'pre' }}
                                    placeholder="Paste CSV or tab-separated (TXT) data here.&#10;First row must be headers:&#10;Player Name, AB, H, R, RBI, K, BB, E&#10;&#10;CSV example:  Jane Doe, 3, 2, 1, 0, 1, 0, 0&#10;TXT example:  Jane Doe[TAB]3[TAB]2[TAB]1[TAB]0[TAB]1[TAB]0[TAB]0"
                                    value={importText}
                                    onChange={(e) => setImportText(e.target.value)}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
                {activeTab === 'manual' ? (
                    <button
                        className="btn btn-primary"
                        onClick={handleSave}
                        disabled={isSaving}
                    >
                        {isSaving ? 'Stats saved ✅' : 'Save Stats'}
                    </button>
                ) : (
                    <button
                        className="btn btn-primary"
                        onClick={handleParseBulk}
                        disabled={!importText.trim()}
                    >
                        Parse & Preview
                    </button>
                )}
            </div>
        </div>
    );
}
