import { useState } from 'react';
import type { Team } from '../../types';
import { generateId } from '../../lib/storage';

interface TeamFormProps {
    team?: Team;
    onSave: (team: Team) => void;
    onCancel: () => void;
}

export function TeamForm({ team, onSave, onCancel }: TeamFormProps) {
    const [name, setName] = useState(team?.name || '');
    const [description, setDescription] = useState(team?.description || '');
    const [errors, setErrors] = useState<Record<string, string>>({});

    const validate = () => {
        const errs: Record<string, string> = {};
        if (!name.trim()) errs.name = 'El nombre del equipo es obligatorio';
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        onSave({
            id: team?.id || generateId(),
            name: name.trim(),
            description: description.trim()
        });
    };

    return (
        <div className="modal-content">
            <div className="modal-header">
                <h3>{team ? 'Actualizar Organización' : '+ Registrar Nuevo Equipo'}</h3>
                <p>{team ? 'Modificá los datos de tu equipo e institución' : 'Creá un nuevo equipo para seguimiento de stats'}</p>
            </div>

            {team && (
                <div className="identity-header">
                    <div className="identity-badge">
                        <div className="identity-icon">🥎</div>
                        <div className="identity-info">
                            <span className="identity-label">Editando Perfil del Equipo</span>
                            <span className="identity-name">{team.name}</span>
                        </div>
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div className="modal-body">
                    <div className="form-group">
                        <label className="form-label">Nombre del Equipo</label>
                        <input
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="ej. Dragones Rojos Softball"
                            className={`form-control ${errors.name ? 'error' : ''}`}
                        />
                        {errors.name && <span className="form-error">{errors.name}</span>}
                    </div>

                    <div className="form-group">
                        <label className="form-label">Descripción (Opcional)</label>
                        <textarea
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="ej. Equipo competitivo de viaje con sede en el sur"
                            className="form-control"
                            rows={3}
                            style={{ resize: 'none' }}
                        />
                    </div>
                </div>

                <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={onCancel} style={{ flex: 1 }}>
                        Descartar
                    </button>
                    <button type="submit" className="btn btn-primary" style={{ flex: 2 }}>
                        {team ? 'Guardar Cambios' : '+ Registrar Equipo'}
                    </button>
                </div>
            </form>
        </div>
    );
}
