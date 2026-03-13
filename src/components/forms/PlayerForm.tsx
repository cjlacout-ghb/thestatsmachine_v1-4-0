import { useState, useRef } from 'react';
import type { Player, Position } from '../../types';
import { generateId, parsePlayerImport } from '../../lib/storage';


const POSITIONS: Position[] = ['P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DP', 'FLEX'];

interface PlayerFormProps {
    player?: Player;
    teamId: string;
    teamName: string;
    onSave: (player: Player) => void;
    onCancel: () => void;
    onBulkImport?: (players: Player[]) => void;
    onDelete?: () => void;
}

export function PlayerForm({ player, teamId, teamName, onSave, onCancel, onBulkImport, onDelete }: PlayerFormProps) {
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
        if (!name.trim()) errs.name = 'El nombre es obligatorio';
        if (!jerseyNumber.trim()) errs.jerseyNumber = 'El número de camiseta es obligatorio';
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
            const players = parsePlayerImport(text, teamId);
            if (players.length > 0 && onBulkImport) {
                onBulkImport(players);
                setShowImport(false);
                setImportText('');
            }
        };
        reader.readAsText(file);
    };




    if (showImport) {
        return (
            <div className="modal-content">
                <div className="modal-header">
                    <span className="modal-super-title">
                        {teamName}
                    </span>
                    <h3>Importación Masiva de Jugadores</h3>
                    <p>Cargá un CSV/TXT o pegá los datos de tu portal de liga</p>
                </div>

                <div className="modal-body">
                    <div className="form-group">
                        <label className="form-label">Subir Archivo de Datos</label>
                        <div className="empty-state" style={{ padding: 'var(--space-lg)' }}>
                            <input
                                type="file"
                                accept=".csv,.txt"
                                onChange={handleFileUpload}
                                ref={fileInputRef}
                                style={{ display: 'none' }}
                            />
                            <button type="button" className="btn btn-secondary" onClick={() => fileInputRef.current?.click()}>
                                Seleccionar Archivo CSV o TXT
                            </button>
                            <p className="text-muted mt-sm" style={{ fontSize: '0.75rem' }}>Formato: Nombre, Número#, Posición (uno por línea)</p>

                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">O Pegá los Datos de los Jugadores</label>
                        <textarea
                            className="form-control"
                            value={importText}
                            onChange={e => setImportText(e.target.value)}
                            placeholder="Name, Jersey, Position&#10;Sofia Martinez, 7, SS&#10;Emma Rodriguez, 22, P"
                            rows={6}
                        />
                    </div>
                </div>

                <div className="modal-footer" style={{ justifyContent: 'center', gap: 'var(--space-md)' }}>
                    <button type="button" className="btn btn-secondary" onClick={() => setShowImport(false)} style={{ minWidth: '140px' }}>
                        Volver
                    </button>
                    <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => {
                            const players = parsePlayerImport(importText, teamId);
                            if (players.length > 0 && onBulkImport) {
                                onBulkImport(players);
                                setShowImport(false);
                                setImportText('');
                            }
                        }}
                        disabled={!importText.trim()}
                        style={{ minWidth: '200px' }}
                    >
                        Importar {importText.trim() ? `${parsePlayerImport(importText, teamId).length} ` : ''}Jugadores
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="modal-content">
            <div className="modal-header" style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <span className="modal-super-title">
                        {teamName}
                    </span>
                    <h3>{player ? 'Editar' : '+ Agregar Nuevo'} Jugador</h3>
                    <p>Ingresá los datos individuales del jugador</p>
                </div>
                {!player && onBulkImport && (
                    <button
                        type="button"
                        className="btn btn-ghost"
                        onClick={() => setShowImport(true)}
                        style={{
                            color: 'white',
                            border: '1px solid rgba(255, 255, 255, 0.4)',
                            padding: '6px 16px',
                            background: 'rgba(255, 255, 255, 0.1)',
                            borderRadius: 'var(--radius-md)'
                        }}
                    >
                        Importación Masiva
                    </button>
                )}
            </div>

            <form onSubmit={handleSubmit}>
                <div className="modal-body">
                    <div className="grid-2">
                        <div className="form-group">
                            <label className="form-label">Nombre Completo</label>
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
                            <label className="form-label">Camiseta #</label>
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
                        <label className="form-label mb-sm">Posición Principal</label>
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
                        <label className="form-label mb-sm">Posiciones Secundarias</label>
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
                            🗑 Eliminar
                        </button>
                    )}
                    <button type="button" className="btn btn-secondary" onClick={onCancel} style={{ flex: 1 }}>
                        Descartar
                    </button>
                    <button type="submit" className="btn btn-primary" style={{ flex: 2 }}>
                        {player ? 'Guardar Perfil' : '+ Agregar'}
                    </button>
                </div>
            </form>
        </div>
    );
}
