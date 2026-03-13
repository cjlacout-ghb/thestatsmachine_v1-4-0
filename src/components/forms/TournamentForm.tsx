import { useState } from 'react';
import type { Tournament, Team } from '../../types';
import { generateId } from '../../lib/storage';

interface TournamentFormProps {
    tournament?: Tournament;
    availableTeams: Team[];
    initialTeamId?: string;
    onSave: (tournament: Tournament) => void;
    onCancel: () => void;
}

export function TournamentForm({ tournament, availableTeams, initialTeamId, onSave, onCancel }: TournamentFormProps) {
    const [name, setName] = useState(tournament?.name || '');
    // participatingTeamIds is set once and used in handleSubmit; the setter is unused after init
    const [participatingTeamIds] = useState<string[]>(
        tournament?.participatingTeamIds || (initialTeamId ? [initialTeamId] : [])
    );
    const [startDate, setStartDate] = useState(tournament?.startDate || '');
    const [endDate, setEndDate] = useState(tournament?.endDate || '');
    const [type, setType] = useState<Tournament['type']>(tournament?.type || 'tournament');
    const [location, setLocation] = useState(tournament?.location || '');
    const [format, setFormat] = useState(tournament?.format || '');
    const [errors, setErrors] = useState<Record<string, string>>({});

    const validate = () => {
        const errs: Record<string, string> = {};
        if (!name.trim()) errs.name = 'El nombre es obligatorio';



        if (startDate && endDate && startDate > endDate) {
            errs.endDate = 'La fecha de fin debe ser posterior a la de inicio';
        }
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        onSave({
            id: tournament?.id || generateId(),
            participatingTeamIds,
            name: name.trim(),
            startDate,
            endDate,
            type,
            location: location.trim(),
            format: format.trim()
        });
    };



    const editingTeam = availableTeams.find(t => t.id === participatingTeamIds[0]);
    const contextTeam = availableTeams.find(t => t.id === initialTeamId);
    const contextTeamName = tournament ? editingTeam?.name : contextTeam?.name;

    return (
        <div className="modal-content">
            <div className="modal-header">
                {contextTeamName && (
                    <span className="modal-super-title">
                        {contextTeamName}
                    </span>
                )}
                <h3>{tournament ? 'Actualizar Configuración del Evento' : '+ Agregar Nuevo Evento'}</h3>
                <p>{tournament ? 'Configurá los detalles del torneo y equipos participantes' : 'Configurá un nuevo evento competitivo o liga'}</p>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="modal-body">
                    <div className="form-group">
                        <label className="form-label">Nombre del Evento</label>
                        <input
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="ej. Campeonato de Primavera 2026"
                            className={`form-control ${errors.name ? 'error' : ''}`}
                        />
                        {errors.name && <span className="form-error">{errors.name}</span>}
                    </div>



                    <div className="grid-2">
                        <div className="form-group">
                            <label className="form-label">Fecha de Inicio (Opcional)</label>

                            <input
                                type="date"
                                value={startDate}
                                onChange={e => {
                                    const newDate = e.target.value;
                                    setStartDate(newDate);
                                    // Sync end date if it's empty or now invalid (before start date)
                                    if (!endDate || endDate < newDate) {
                                        setEndDate(newDate);
                                    }
                                }}
                                className={`form-control ${errors.startDate ? 'error' : ''}`}
                            />
                            {errors.startDate && <span className="form-error">{errors.startDate}</span>}
                        </div>

                        <div className="form-group">
                            <label className="form-label">Fecha de Fin (Opcional)</label>

                            <input
                                type="date"
                                value={endDate}
                                onChange={e => setEndDate(e.target.value)}
                                className={`form-control ${errors.endDate ? 'error' : ''}`}
                            />
                            {errors.endDate && <span className="form-error">{errors.endDate}</span>}
                        </div>
                    </div>

                    <div className="grid-2">
                        <div className="form-group">
                            <label className="form-label">Sede (Opcional)</label>
                            <input
                                type="text"
                                value={location}
                                onChange={e => setLocation(e.target.value)}
                                placeholder="ej. Parque Central"
                                className="form-control"
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Formato (Opcional)</label>
                            <input
                                type="text"
                                value={format}
                                onChange={e => setFormat(e.target.value)}
                                placeholder="ej. Fase de grupos + Llave"
                                className="form-control"
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label mb-sm">Tipo de Evento (Opcional)</label>

                        <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                            {['tournament', 'league', 'friendly'].map(t => {
                                const labels: Record<string, string> = { tournament: 'torneo', league: 'liga', friendly: 'amistoso' };
                                return (
                                    <button
                                        key={t}
                                        type="button"
                                        className={`btn ${type === t ? 'btn-primary' : 'btn-secondary'}`}
                                        onClick={() => setType(t as Tournament['type'])}
                                        style={{ flex: 1 }}
                                    >
                                        {labels[t]}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={onCancel} style={{ flex: 1 }}>
                        Descartar
                    </button>
                    <button type="submit" className="btn btn-primary" style={{ flex: 2 }}>
                        {tournament ? 'Guardar Cambios' : '+ Crear Evento'}
                    </button>
                </div>
            </form>
        </div>
    );
}
