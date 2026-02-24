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
        if (!name.trim()) errs.name = 'Name is required';



        if (startDate && endDate && startDate > endDate) {
            errs.endDate = 'End date must be after start date';
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

    return (
        <div className="modal-content">
            <div className="modal-header">
                <h3>{tournament ? 'Update Event Settings' : 'Initialize New Event'}</h3>
                <p>{tournament ? 'Configure tournament details and team participants' : 'Setup a new competitive event or league season'}</p>
            </div>

            {tournament && (
                <div className="identity-header">
                    <div className="identity-badge" style={{ borderColor: 'var(--avg)' }}>
                        <div className="identity-icon" style={{ background: 'var(--avg)' }}>🏆</div>
                        <div className="identity-info">
                            <span className="identity-label">Editing Event</span>
                            <span className="identity-name">{tournament.name}</span>
                        </div>
                    </div>
                    {editingTeam && (
                        <div className="identity-badge">
                            <div className="identity-icon">🥎</div>
                            <div className="identity-info">
                                <span className="identity-label">Primary Team</span>
                                <span className="identity-name">{editingTeam.name}</span>
                            </div>
                        </div>
                    )}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div className="modal-body">
                    <div className="form-group">
                        <label className="form-label">Event Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="e.g. Spring Championship 2026"
                            className={`form-control ${errors.name ? 'error' : ''}`}
                        />
                        {errors.name && <span className="form-error">{errors.name}</span>}
                    </div>



                    <div className="grid-2">
                        <div className="form-group">
                            <label className="form-label">Start Date (Optional)</label>

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
                            <label className="form-label">End Date (Optional)</label>

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
                            <label className="form-label">Location (Optional)</label>
                            <input
                                type="text"
                                value={location}
                                onChange={e => setLocation(e.target.value)}
                                placeholder="e.g. Central Park"
                                className="form-control"
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Format (Optional)</label>
                            <input
                                type="text"
                                value={format}
                                onChange={e => setFormat(e.target.value)}
                                placeholder="e.g. Pool Play + Bracket"
                                className="form-control"
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label mb-sm">Event Type (Optional)</label>

                        <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                            {['tournament', 'league', 'friendly'].map(t => (
                                <button
                                    key={t}
                                    type="button"
                                    className={`btn ${type === t ? 'btn-primary' : 'btn-secondary'}`}
                                    onClick={() => setType(t as Tournament['type'])}
                                    style={{ flex: 1, textTransform: 'capitalize' }}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={onCancel} style={{ flex: 1 }}>
                        Discard
                    </button>
                    <button type="submit" className="btn btn-primary" style={{ flex: 2 }}>
                        {tournament ? 'Save Changes' : 'Create Event'}
                    </button>
                </div>
            </form>
        </div>
    );
}
