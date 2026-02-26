import { useState, useRef } from 'react';
import type { Player, Position } from '../../types';
import { generateId, parsePlayerImport } from '../../lib/storage';
import { downloadCSVTemplate, downloadTXTTemplate } from '../../lib/fileDownloader';

const POSITIONS: Position[] = ['P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DP', 'FLEX'];

interface PlayerFormProps {
    player?: Player;
    teamId: string;
    onSave: (player: Player) => void;
    onCancel: () => void;
    onBulkImport?: (players: Player[]) => void;
    onDelete?: () => void;
}

export function PlayerForm({ player, teamId, onSave, onCancel, onBulkImport, onDelete }: PlayerFormProps) {
    const [name, setName] = useState(player?.name || '');
    const [jerseyNumber, setJerseyNumber] = useState(player?.jerseyNumber || '');
    const [primaryPosition, setPrimaryPosition] = useState<Position>(player?.primaryPosition || 'DP');
    const [secondaryPositions, setSecondaryPositions] = useState<Position[]>(player?.secondaryPositions || []);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [showImport, setShowImport] = useState(false);
    const [importText, setImportText] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const validate = () => {
        const errs: Record<string, string> = {};
        if (!name.trim()) errs.name = 'Name is required';
        if (!jerseyNumber.trim()) errs.jerseyNumber = 'Jersey number is required';
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        onSave({
            id: player?.id || generateId(),
            name: name.trim(),
            jerseyNumber: jerseyNumber.trim(),
            primaryPosition,
            secondaryPositions,
            teamId,
        });
    };

    const toggleSecondary = (pos: Position) => {
        if (pos === primaryPosition) return;
        setSecondaryPositions(prev =>
            prev.includes(pos)
                ? prev.filter(p => p !== pos)
                : [...prev, pos]
        );
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (ev) => {
            const text = ev.target?.result as string;
            setImportText(text);
        };
        reader.readAsText(file);
    };


    const handleImport = () => {
        const players = parsePlayerImport(importText, teamId);
        if (players.length > 0 && onBulkImport) {
            onBulkImport(players);
            setShowImport(false);
            setImportText('');
        }
    };

    if (showImport) {
        return (
            <div className="modal-content">
                <div className="modal-header">
                    <h3>Bulk Player Import</h3>
                    <p>Upload CSV/TXT or paste roster data from your league portal</p>
                </div>

                <div className="modal-body">
                    <div className="form-group">
                        <label className="form-label">Upload Data File</label>
                        <div className="empty-state" style={{ padding: 'var(--space-lg)' }}>
                            <input
                                type="file"
                                accept=".csv,.txt"
                                onChange={handleFileUpload}
                                ref={fileInputRef}
                                style={{ display: 'none' }}
                            />
                            <button type="button" className="btn btn-secondary" onClick={() => fileInputRef.current?.click()}>
                                Select CSV or TXT File
                            </button>
                            <p className="text-muted mt-sm" style={{ fontSize: '0.75rem' }}>Format: Name, Jersey#, Position (one per line)</p>
                            <div style={{ display: 'flex', gap: 'var(--space-md)', marginTop: 'var(--space-md)', justifyContent: 'center' }}>
                                <button type="button" className="btn btn-ghost btn-sm" onClick={downloadCSVTemplate} style={{ color: 'var(--primary-color)' }}>
                                    📥 Download Template (.csv)
                                </button>
                                <button type="button" className="btn btn-ghost btn-sm" onClick={downloadTXTTemplate} style={{ color: 'var(--primary-color)' }}>
                                    📥 Download Template (.txt)
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Or Paste Roster Data</label>
                        <textarea
                            className="form-control"
                            value={importText}
                            onChange={e => setImportText(e.target.value)}
                            placeholder="Name, Jersey, Position&#10;Sofia Martinez, 7, SS&#10;Emma Rodriguez, 22, P"
                            rows={6}
                        />
                    </div>
                </div>

                <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={() => setShowImport(false)} style={{ flex: 1 }}>
                        Back
                    </button>
                    <button
                        type="button"
                        className="btn btn-primary"
                        onClick={handleImport}
                        disabled={!importText.trim()}
                        style={{ flex: 2 }}
                    >
                        Import {importText ? parsePlayerImport(importText, teamId).length : ''} Players
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="modal-content">
            <div className="modal-header" style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h3>{player ? 'Edit' : 'Add New'} Player</h3>
                    <p>Enter individual player details for tracking</p>
                </div>
                {!player && onBulkImport && (
                    <button type="button" className="btn btn-ghost" onClick={() => setShowImport(true)} style={{ color: 'white' }}>
                        Bulk Import
                    </button>
                )}
            </div>

            <form onSubmit={handleSubmit}>
                <div className="modal-body">
                    <div className="grid-2">
                        <div className="form-group">
                            <label className="form-label">Full Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="Sofia Martinez"
                                className={`form-control ${errors.name ? 'error' : ''}`}
                            />
                            {errors.name && <span className="form-error">{errors.name}</span>}
                        </div>
                        <div className="form-group">
                            <label className="form-label">Jersey #</label>
                            <input
                                type="text"
                                value={jerseyNumber}
                                onChange={e => setJerseyNumber(e.target.value)}
                                placeholder="7"
                                className={`form-control ${errors.jerseyNumber ? 'error' : ''}`}
                            />
                            {errors.jerseyNumber && <span className="form-error">{errors.jerseyNumber}</span>}
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label mb-sm">Primary Position</label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-sm)' }}>
                            {POSITIONS.map(pos => (
                                <button
                                    key={pos}
                                    type="button"
                                    className={`btn ${primaryPosition === pos ? 'btn-primary' : 'btn-secondary'}`}
                                    onClick={() => {
                                        setPrimaryPosition(pos);
                                        setSecondaryPositions(prev => prev.filter(p => p !== pos));
                                    }}
                                    style={{ padding: '6px 14px', borderRadius: 'var(--radius-full)', fontSize: '0.8125rem' }}
                                >
                                    {pos}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label mb-sm">Secondary Options</label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-sm)' }}>
                            {POSITIONS.filter(p => p !== primaryPosition).map(pos => {
                                const isActive = secondaryPositions.includes(pos);
                                return (
                                    <button
                                        key={pos}
                                        type="button"
                                        className={`btn ${isActive ? 'btn-primary' : 'btn-secondary'}`}
                                        style={{
                                            padding: '6px 14px',
                                            borderRadius: 'var(--radius-full)',
                                            fontSize: '0.8125rem',
                                            opacity: isActive ? 1 : 0.6,
                                            background: isActive ? 'var(--accent-gradient)' : 'transparent',
                                            color: isActive ? 'white' : 'var(--text-secondary)',
                                            borderColor: isActive ? 'transparent' : 'var(--border-color)'
                                        }}
                                        onClick={() => toggleSecondary(pos)}
                                    >
                                        {pos}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="modal-footer">
                    {player && (
                        <button type="button" className="btn btn-danger" onClick={onDelete} style={{ marginRight: 'auto' }}>
                            🗑 Delete
                        </button>
                    )}
                    <button type="button" className="btn btn-secondary" onClick={onCancel} style={{ flex: 1 }}>
                        Discard
                    </button>
                    <button type="submit" className="btn btn-primary" style={{ flex: 2 }}>
                        {player ? 'Save Profile' : 'Add to Roster'}
                    </button>
                </div>
            </form>
        </div>
    );
}
