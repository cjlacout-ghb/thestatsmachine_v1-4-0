import { useState } from 'react';
import type { Team, Tournament, Player, Game, AppData, PlayerGameStats } from '../../types';
import { TeamForm } from '../forms/TeamForm';
import { TournamentForm } from '../forms/TournamentForm';
import { PlayerForm } from '../forms/PlayerForm';
import { GameForm } from '../forms/GameForm';
import { PlayerStatsModal } from '../forms/PlayerStatsModal';
import { resetDatabase } from '../../lib/storage';


export type ModalType = 'team' | 'tournament' | 'player' | 'game' | 'erase' | 'help' | 'player_stats' | 'delete_team' | 'delete_player' | 'delete_tournament' | 'delete_game' | 'import_success' | 'import_confirm' | 'info' | null;

interface AppModalsProps {
    modalType: ModalType;
    editItem: Team | Tournament | Player | Game | null;
    activeTeam: Team | null;
    activeTournament: Tournament | null;
    defaultGameDate?: string;
    data: AppData;
    onClose: () => void;
    onSaveTeam: (t: Team) => void;
    onSaveTournament: (t: Tournament) => void;
    onSavePlayer: (p: Player) => void;
    onSaveGame: (g: Game) => void;
    onSaveGameStats: (gameId: string, stats: PlayerGameStats[]) => void;
    onDeletePlayer?: (id: string) => void;
    onDeleteGame?: (id: string) => void;
    onDeleteTournamentConfirm?: (id: string) => void;
    onDeleteTeamConfirm?: (id: string) => void;
    onBulkImportPlayers: (players: Player[]) => void;
    onConfirmImport?: () => void;
}

export function AppModals({
    modalType,
    editItem,
    activeTeam,
    activeTournament,
    defaultGameDate,
    data,
    onClose,
    onSaveTeam,
    onSaveTournament,
    onSavePlayer,
    onSaveGame,
    onSaveGameStats,
    onDeletePlayer,
    onDeleteGame,
    onDeleteTournamentConfirm,
    onDeleteTeamConfirm,
    onBulkImportPlayers,
    onConfirmImport,
}: AppModalsProps) {
    if (!modalType) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-container" onClick={e => e.stopPropagation()}>
                {modalType === 'team' && (
                    <TeamForm
                        team={editItem as Team | undefined}
                        onSave={onSaveTeam}
                        onCancel={onClose}
                    />
                )}
                {modalType === 'tournament' && (
                    <TournamentForm
                        key={editItem ? (editItem as Tournament).id : 'new-tournament'}
                        tournament={editItem as Tournament | undefined}
                        availableTeams={data.teams}
                        initialTeamId={activeTeam?.id}
                        onSave={onSaveTournament}
                        onCancel={onClose}
                    />
                )}
                {modalType === 'player' && activeTeam && (
                    <PlayerForm
                        key={editItem ? (editItem as Player).id : 'new-player'}
                        player={editItem as Player | undefined}
                        teamId={activeTeam.id}
                        teamName={activeTeam.name}
                        onSave={onSavePlayer}
                        onCancel={onClose}
                        onBulkImport={onBulkImportPlayers}
                        onDelete={editItem ? () => onDeletePlayer?.((editItem as Player).id) : undefined}
                    />
                )}
                {modalType === 'game' && activeTournament && activeTeam && (() => {
                    // Compute initialDate HERE where activeTournament is guaranteed fresh.
                    // Priority: 1) editing game's own date, 2) parent's defaultGameDate (most recent game date),
                    // 3) tournament startDate, 4) today.
                    const gameInitialDate = (editItem as Game | undefined)?.date
                        || defaultGameDate
                        || activeTournament.startDate
                        || new Date().toISOString().split('T')[0];
                    return (
                        <GameForm
                            key={editItem ? (editItem as Game).id : `new-game-${activeTournament.id}-${activeTournament.startDate}-${activeTournament.name}`}
                            game={editItem as Game | undefined}
                            tournamentId={activeTournament.id}
                            tournamentName={activeTournament.name}
                            initialDate={gameInitialDate}
                            teamName={activeTeam.name}
                            players={data.players.filter(p => p.teamId === activeTeam.id)}
                            onSave={onSaveGame}
                            onCancel={onClose}
                            onDelete={editItem ? () => onDeleteGame?.((editItem as Game).id) : undefined}
                        />
                    );
                })()}
                {modalType === 'player_stats' && editItem && activeTeam && (
                    <PlayerStatsModal
                        game={editItem as Game}
                        teamName={activeTeam.name}
                        players={data.players.filter(p => p.teamId === activeTeam.id)}
                        onSave={onSaveGameStats}
                        onCancel={onClose}
                    />
                )}
                {modalType === 'erase' && (
                    <EraseDataModal onClose={onClose} />
                )}
                {modalType === 'help' && (
                    <HelpModal onClose={onClose} />
                )}
                {modalType === 'delete_team' && editItem && (
                    <GenericDeleteModal
                        title="¿Eliminar Equipo?"
                        message={`¿Estás absolutamente seguro de que quieres eliminar a ${(editItem as Team).name}? Esto borrará todos sus torneos, jugadores y estadísticas para siempre.`}
                        onClose={onClose}
                        onConfirm={() => {
                            if (onDeleteTeamConfirm) onDeleteTeamConfirm((editItem as Team).id);
                        }}
                    />
                )}
                {modalType === 'delete_player' && editItem && (
                    <GenericDeleteModal
                        title="¿Eliminar Jugador?"
                        message={`Confirmá la eliminación permanente de ${(editItem as Player).name}. Sus estadísticas históricas se perderán.`}
                        onClose={onClose}
                        onConfirm={() => {
                            if (onDeletePlayer) onDeletePlayer((editItem as Player).id);
                        }}
                    />
                )}
                {modalType === 'delete_tournament' && editItem && (
                    <GenericDeleteModal
                        title="¿Eliminar Evento?"
                        message={`¿Confirmás que querés eliminar ${(editItem as Tournament).name}? Se perderán los calendarios y resultados.`}
                        onClose={onClose}
                        onConfirm={() => {
                            if (onDeleteTournamentConfirm) onDeleteTournamentConfirm((editItem as Tournament).id);
                        }}
                    />
                )}
                {modalType === 'delete_game' && editItem && (
                    <GenericDeleteModal
                        title="¿Eliminar Registro?"
                        message="¿Estás seguro de que quieres borrar este registro de partido? Esta acción no se puede deshacer."
                        onClose={onClose}
                        onConfirm={() => {
                            if (onDeleteGame) onDeleteGame((editItem as Game).id);
                        }}
                    />
                )}
                {modalType === 'import_success' && (
                    <ImportSuccessModal
                        onConfirm={onClose}
                    />
                )}
                {modalType === 'import_confirm' && (
                    <ImportConfirmModal
                        onConfirm={() => {
                            if (onConfirmImport) onConfirmImport();
                        }}
                        onCancel={onClose}
                    />
                )}
                {modalType === 'info' && editItem && (
                    <GenericMessageModal
                        title={(editItem as any).title || 'Atención'}
                        message={(editItem as any).message || ''}
                        type={(editItem as any).type || 'info'}
                        onClose={onClose}
                    />
                )}
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// GenericMessageModal — premium replacement for browser alert()
// ---------------------------------------------------------------------------
function GenericMessageModal({ title, message, type, onClose }: { title: string, message: string, type: 'info' | 'error' | 'warning', onClose: () => void }) {
    const icon = type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️';
    const headerBg = type === 'error' ? 'linear-gradient(135deg, #ef4444, #b91c1c)' :
        type === 'warning' ? 'linear-gradient(135deg, #f59e0b, #d97706)' :
            'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))';

    return (
        <div className="modal-content" style={{ minWidth: '350px', maxWidth: '450px', textAlign: 'center' }}>
            <div className="modal-header" style={{
                background: headerBg,
                borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0',
                padding: 'var(--space-xl) var(--space-lg)'
            }}>
                <div style={{ fontSize: '3rem', marginBottom: 'var(--space-md)' }}>{icon}</div>
                <h3 style={{ color: 'white', margin: 0 }}>{title}</h3>
            </div>

            <div className="modal-body">
                <p style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1rem', lineHeight: '1.5' }}>
                    {message}
                </p>
            </div>

            <div className="modal-footer" style={{ justifyContent: 'center', padding: 'var(--space-lg)' }}>
                <button className="btn btn-primary" onClick={onClose} style={{ minWidth: '120px' }}>
                    Entendido
                </button>
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// GenericDeleteModal — premium replacement for browser confirm()
// ---------------------------------------------------------------------------
function GenericDeleteModal({ title, message, onClose, onConfirm }: { title: string, message: string, onClose: () => void, onConfirm: () => void }) {
    return (
        <div className="modal-content" style={{ minWidth: '400px', maxWidth: '450px' }}>
            <div className="modal-header" style={{
                background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0'
            }}>
                <h3 style={{ color: 'white', margin: 0 }}>{title}</h3>
            </div>

            <div className="modal-body">
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--space-md)',
                    textAlign: 'center'
                }}>
                    <div style={{ fontSize: '3rem', marginBottom: 'var(--space-sm)' }}>🗑️</div>
                    <p style={{ margin: 0, color: 'var(--text-primary)', fontWeight: 600 }}>
                        ¿Estás absolutamente seguro?
                    </p>
                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.5' }}>
                        {message}
                    </p>
                </div>
            </div>

            <div className="modal-footer" style={{ padding: 'var(--space-lg) var(--space-xl)', background: 'var(--bg-primary)' }}>
                <button
                    className="btn btn-secondary"
                    style={{ flex: 1 }}
                    onClick={onClose}
                >
                    Cancelar
                </button>
                <button
                    className="btn"
                    style={{
                        flex: 1,
                        background: '#dc2626',
                        color: 'white',
                        fontWeight: 700,
                        border: 'none',
                        boxShadow: '0 2px 8px rgba(220, 38, 38, 0.2)'
                    }}
                    onClick={onConfirm}
                >
                    Eliminar para Siempre
                </button>
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// ImportConfirmModal — premium confirmation before overwriting data
// ---------------------------------------------------------------------------
function ImportConfirmModal({ onConfirm, onCancel }: { onConfirm: () => void, onCancel: () => void }) {
    return (
        <div className="modal-content" style={{ minWidth: '400px', maxWidth: '450px', textAlign: 'center', margin: 'auto' }}>
            <div className="modal-header" style={{
                background: 'linear-gradient(135deg, var(--avg), #d97706)',
                borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0',
                padding: 'var(--space-xl) var(--space-lg)',
                flexDirection: 'column'
            }}>
                <div style={{ fontSize: '3.5rem', marginBottom: 'var(--space-md)' }}>⚠️</div>
                <h3 style={{ color: 'white', margin: 0, fontSize: '1.5rem' }}>¿Sobreescribir Datos?</h3>
                <p style={{ color: 'rgba(255,255,255,0.9)', margin: '8px 0 0 0', fontSize: '0.95rem' }}>
                    Se detectaron datos existentes en la aplicación.
                </p>
            </div>

            <div className="modal-body">
                <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: '1.6', fontSize: '1rem' }}>
                    Si continuas, todos los equipos, jugadores y estadísticas actuales serán <strong>reemplazados</strong> por los del archivo seleccionado.
                </p>
            </div>

            <div className="modal-footer" style={{ padding: 'var(--space-lg) var(--space-xl)', gap: 'var(--space-md)' }}>
                <button
                    className="btn btn-secondary"
                    style={{ flex: 1, padding: '12px' }}
                    onClick={onCancel}
                >
                    Cancelar
                </button>
                <button
                    className="btn btn-primary"
                    style={{
                        flex: 1,
                        padding: '12px',
                        fontSize: '1rem',
                        fontWeight: 700,
                        background: 'var(--avg)',
                        border: 'none',
                        boxShadow: '0 4px 12px rgba(245, 158, 11, 0.2)'
                    }}
                    onClick={onConfirm}
                >
                    Confirmar e Importar
                </button>
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// ImportSuccessModal — premium success notification after data import
// ---------------------------------------------------------------------------
function ImportSuccessModal({ onConfirm }: { onConfirm: () => void }) {
    return (
        <div className="modal-content" style={{ minWidth: '380px', maxWidth: '420px', textAlign: 'center', margin: 'auto' }}>
            <div className="modal-header" style={{
                background: 'linear-gradient(135deg, var(--elite), #15803d)',
                borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0',
                padding: 'var(--space-xl) var(--space-lg)',
                flexDirection: 'column'
            }}>
                <div style={{ fontSize: '3.5rem', marginBottom: 'var(--space-md)' }}>🎉</div>
                <h3 style={{ color: 'white', margin: 0, fontSize: '1.5rem' }}>¡Importación Exitosa!</h3>
                <p style={{ color: 'rgba(255,255,255,0.9)', margin: '8px 0 0 0', fontSize: '0.95rem' }}>
                    Tus datos se han cargado correctamente.
                </p>
            </div>

            <div className="modal-body">
                <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: '1.6', fontSize: '1rem' }}>
                    Los datos han sido cargados en la sesión actual y están listos para usarse.
                </p>
            </div>

            <div className="modal-footer" style={{ padding: 'var(--space-lg) var(--space-xl)' }}>
                <button
                    className="btn btn-primary"
                    style={{
                        width: '100%',
                        padding: '12px',
                        fontSize: '1rem',
                        fontWeight: 700,
                        background: 'var(--elite)',
                        border: 'none',
                        boxShadow: '0 4px 12px rgba(21, 128, 61, 0.2)'
                    }}
                    onClick={onConfirm}
                >
                    Continuar
                </button>
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// EraseDataModal — standalone, typed-confirmation destructive action
// ---------------------------------------------------------------------------
function EraseDataModal({ onClose }: { onClose: () => void }) {
    const [validationText, setValidationText] = useState('');
    const canErase = validationText === 'RESET';

    return (
        <div className="modal-content" style={{ minWidth: '420px', maxWidth: '480px' }}>
            <div className="modal-header" style={{
                background: 'linear-gradient(135deg, #b91c1c, #991b1b)',
                borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0'
            }}>
                <h3 style={{ color: 'white', margin: 0 }}>⚠️ Borrar Todos los Datos</h3>
                <p style={{ color: 'rgba(255,255,255,0.8)', margin: '4px 0 0 0', fontSize: '0.875rem' }}>
                    Esta acción es permanente y no se puede deshacer.
                </p>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                <div style={{
                    background: 'color-mix(in srgb, var(--danger-color) 8%, transparent)',
                    border: '1px solid var(--danger-color)',
                    borderRadius: 'var(--radius-md)',
                    padding: 'var(--space-md)',
                    fontSize: '0.875rem',
                    lineHeight: '1.6'
                }}>
                    <p style={{ margin: '0 0 8px 0', fontWeight: 600, color: 'var(--danger-color)' }}>
                        Estás a punto de eliminar permanentemente:
                    </p>
                    <ul style={{ margin: 0, paddingLeft: '1.25rem', color: 'var(--text-primary)' }}>
                        <li>Todos los Equipos</li>
                        <li>Todos los Jugadores</li>
                        <li>Todos los Eventos</li>
                        <li>Todos los Registros y Estadísticas</li>
                    </ul>
                </div>

                <div>
                    <label style={{
                        display: 'block',
                        fontSize: '0.8125rem',
                        fontWeight: 600,
                        marginBottom: 'var(--space-xs)',
                        color: 'var(--text-secondary)'
                    }}>
                        Escribí <strong style={{ color: 'var(--danger-color)', letterSpacing: '0.05em' }}>RESET</strong> para habilitar el botón de borrado:
                    </label>
                    <input
                        type="text"
                        className="form-control"
                        value={validationText}
                        onChange={e => setValidationText(e.target.value)}
                        placeholder="Escribí RESET aquí"
                        autoFocus
                        style={{ border: `2px solid ${canErase ? 'var(--danger-color)' : 'var(--border-light)'}` }}
                    />
                </div>
            </div>

            <div className="modal-footer" style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                <button
                    className="btn btn-secondary"
                    style={{ flex: 1 }}
                    onClick={onClose}
                >
                    Cancelar
                </button>
                <button
                    className="btn"
                    style={{
                        flex: 1,
                        background: canErase ? '#dc2626' : 'var(--bg-subtle)',
                        color: canErase ? 'white' : 'var(--text-muted)',
                        border: canErase ? '1px solid #dc2626' : '1px solid var(--border-light)',
                        cursor: canErase ? 'pointer' : 'not-allowed',
                        fontWeight: 700,
                        transition: 'all 0.2s ease',
                        boxShadow: canErase ? '0 2px 4px rgba(220, 38, 38, 0.2)' : 'none'
                    }}
                    disabled={!canErase}
                    onClick={async () => { if (canErase) await resetDatabase(); }}
                >
                    Borrar Todos los Datos
                </button>
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// HelpModal — bilingual help content (unchanged)
// ---------------------------------------------------------------------------
const helpContentEN = {
    title: "How Your Data is Saved",
    sections: [
        {
            icon: "💾",
            title: "Automatic Saving",
            body: "Your data is saved automatically every time you make a change. You don't need to press any save button. As long as you are using the same browser on the same device, your data will always be there when you come back."
        },
        {
            icon: "⚠️",
            title: "Important: Your Data Lives in This Browser",
            body: "Your data is stored inside this browser on this device only. If you open the app on a different browser or a different device, you will not see your data there. It does not sync automatically between devices."
        },
        {
            icon: "📤",
            title: "How to Back Up Your Data",
            body: "We strongly recommend saving a backup regularly, especially before major tournaments or after entering a lot of data. Click the 💾 Save button in the header. A .json file will be saved to the location you choose. Keep this file somewhere safe — it contains everything."
        },
        {
            icon: "📥",
            title: "How to Restore Your Data",
            body: "If you switch devices, use a different browser, or accidentally lose your data, you can restore it from your backup file. Click the 📥 Import Data button in the header and select your .json file. Your data will be fully restored in seconds."
        },
        {
            icon: "🗑️",
            title: "What Clears Your Data",
            body: "Your data can be lost if you clear your browser's cache or site data from your browser settings. This does not happen automatically — you would have to do it manually. If this ever happens, you can restore everything from your last backup file."
        },
        {
            icon: "✅",
            title: "Best Practice",
            body: "Save a backup after every important session. Store the file in a cloud folder like Google Drive or Dropbox so you always have access to it, even if you change devices."
        }
    ]
};

const helpContentES = {
    title: "Cómo se Guardan tus Datos",
    sections: [
        {
            icon: "💾",
            title: "Guardado Automático",
            body: "Tus datos se guardan automáticamente cada vez que realizas un cambio. No necesitas presionar ningún botón de guardar. Siempre que uses el mismo navegador en el mismo dispositivo, tus datos estarán ahí cuando vuelvas."
        },
        {
            icon: "⚠️",
            title: "Importante: Tus Datos Viven en Este Navegador",
            body: "Tus datos se almacenan dentro de este navegador, en este dispositivo únicamente. Si abres la aplicación en un navegador diferente o en otro dispositivo, no verás tus datos allí. No se sincronizan automáticamente entre dispositivos."
        },
        {
            icon: "📤",
            title: "Cómo Hacer una Copia de Seguridad",
            body: "Recomendamos guardar una copia de seguridad regularmente, especialmente antes de torneos importantes o después de ingresar muchos datos. Haz clic en el botón 💾 Guardar del encabezado. Se guardará un archivo .json en la ubicación que elijas. Guarda ese archivo en un lugar seguro."
        },
        {
            icon: "📥",
            title: "Cómo Restaurar tus Datos",
            body: "Si cambias de dispositivo, usas un navegador diferente, o accidentalmente pierdes tus datos, puedes restaurarlos desde tu archivo de copia de seguridad. Haz clic en el botón 📥 Importar Datos del encabezado y selecciona tu archivo .json. Tus datos se restaurarán completamente en segundos."
        },
        {
            icon: "🗑️",
            title: "Qué Puede Borrar tus Datos",
            body: "Tus datos pueden perderse si limpias el caché o los datos del sitio desde la configuración de tu navegador. Esto no ocurre de forma automática — tendrías que hacerlo manualmente. Si esto llegara a pasar, puedes restaurar todo desde tu último archivo de copia de seguridad."
        },
        {
            icon: "✅",
            title: "Buenas Prácticas",
            body: "Guarda una copia de seguridad después de cada sesión importante. Guarda el archivo en una carpeta en la nube como Google Drive o Dropbox para que siempre tengas acceso a él, incluso si cambias de dispositivo."
        }
    ]
};

function HelpModal({ onClose }: { onClose: () => void }) {
    const [lang, setLang] = useState<'en' | 'es'>('es');
    const content = lang === 'en' ? helpContentEN : helpContentES;

    return (
        <div className="modal-content">
            <div className="modal-header" style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0 }}>{content.title}</h3>
                <button
                    className="btn btn-secondary"
                    onClick={() => setLang(lang === 'en' ? 'es' : 'en')}
                    style={{ padding: '6px 12px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                    <span style={{ fontSize: '1.1rem', marginTop: '-1px' }}>🌐</span>
                    <span>{lang === 'en' ? 'Ver en Español' : 'View in English'}</span>
                </button>
            </div>
            <div className="modal-body">
                <div style={{ display: 'grid', gap: 'var(--space-md)' }}>
                    {content.sections.map((section, index) => (
                        <div key={index} style={{ display: 'flex', gap: 'var(--space-md)', alignItems: 'flex-start' }}>
                            <div style={{ fontSize: '1.5rem', flexShrink: 0, marginTop: '-2px' }}>{section.icon}</div>
                            <div>
                                <h4 className="text-bold mb-xs" style={{ margin: '0 0 4px 0' }}>{section.title}</h4>
                                <p className="text-secondary" style={{ fontSize: '0.9rem', lineHeight: '1.4', margin: 0 }}>
                                    {section.body}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <div className="modal-footer">
                <button className="btn btn-primary" onClick={onClose} style={{ width: '100%' }}>
                    {lang === 'en' ? 'Got it!' : '¡Entendido!'}
                </button>
            </div>
        </div>
    );
}


