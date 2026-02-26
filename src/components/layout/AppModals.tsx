import { useState } from 'react';
import type { Team, Tournament, Player, Game, AppData, PlayerGameStats } from '../../types';
import { TeamForm } from '../forms/TeamForm';
import { TournamentForm } from '../forms/TournamentForm';
import { PlayerForm } from '../forms/PlayerForm';
import { GameForm } from '../forms/GameForm';
import { PlayerStatsModal } from '../forms/PlayerStatsModal';
import { StorageSettings } from '../ui/StorageSettings';


export type ModalType = 'team' | 'tournament' | 'player' | 'game' | 'storage' | 'help' | 'player_stats' | null;

interface AppModalsProps {
    modalType: ModalType;
    editItem: Team | Tournament | Player | Game | null;
    activeTeam: Team | null;
    activeTournament: Tournament | null;
    data: AppData;
    onClose: () => void;
    onSaveTeam: (t: Team) => void;
    onSaveTournament: (t: Tournament) => void;
    onSavePlayer: (p: Player) => void;
    onSaveGame: (g: Game) => void;
    onSaveGameStats: (gameId: string, stats: PlayerGameStats[]) => void;
    onDeletePlayer?: (id: string) => void;
    onDeleteGame?: (id: string) => void;
    onBulkImportPlayers: (players: Player[]) => void;
    onStorageReset: () => void;
}

export function AppModals({
    modalType,
    editItem,
    activeTeam,
    activeTournament,
    data,
    onClose,
    onSaveTeam,
    onSaveTournament,
    onSavePlayer,
    onSaveGame,
    onSaveGameStats,
    onDeletePlayer,
    onDeleteGame,
    onBulkImportPlayers,
    onStorageReset
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
                        tournament={editItem as Tournament | undefined}
                        availableTeams={data.teams}
                        initialTeamId={activeTeam?.id}
                        onSave={onSaveTournament}
                        onCancel={onClose}
                    />
                )}
                {modalType === 'player' && activeTeam && (
                    <PlayerForm
                        player={editItem as Player | undefined}
                        teamId={activeTeam.id}
                        onSave={onSavePlayer}
                        onCancel={onClose}
                        onBulkImport={onBulkImportPlayers}
                        onDelete={editItem ? () => onDeletePlayer?.((editItem as Player).id) : undefined}
                    />
                )}
                {modalType === 'game' && activeTournament && activeTeam && (
                    <GameForm
                        game={editItem as Game | undefined}
                        tournamentId={activeTournament.id}
                        initialDate={activeTournament.startDate}
                        teamName={activeTeam.name}
                        players={data.players.filter(p => p.teamId === activeTeam.id)}
                        onSave={onSaveGame}
                        onCancel={onClose}
                        onDelete={editItem ? () => onDeleteGame?.((editItem as Game).id) : undefined}
                    />
                )}
                {modalType === 'player_stats' && editItem && activeTeam && (
                    <PlayerStatsModal
                        game={editItem as Game}
                        teamName={activeTeam.name}
                        players={data.players.filter(p => p.teamId === activeTeam.id)}
                        onSave={onSaveGameStats}
                        onCancel={onClose}
                    />
                )}
                {modalType === 'storage' && (
                    <StorageSettings
                        onStorageChange={onStorageReset}
                        onClose={onClose}
                    />
                )}
                {modalType === 'help' && (
                    <HelpModal onClose={onClose} />
                )}
            </div>
        </div>
    );
}

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
            body: "We strongly recommend exporting a backup regularly, especially before major tournaments or after entering a lot of data. To do this, go to Storage Configuration and click Export Backup. A .json file will be downloaded to your device. Keep this file somewhere safe — it contains everything."
        },
        {
            icon: "📥",
            title: "How to Restore Your Data",
            body: "If you switch devices, use a different browser, or accidentally lose your data, you can restore it from your backup file. Go to Storage Configuration, click Import Backup, and select your .json file. Your data will be fully restored in seconds."
        },
        {
            icon: "🗑️",
            title: "What Clears Your Data",
            body: "Your data can be lost if you clear your browser's cache or site data from your browser settings. This does not happen automatically — you would have to do it manually. If this ever happens, you can restore everything from your last backup file."
        },
        {
            icon: "✅",
            title: "Best Practice",
            body: "Export a backup after every important session. Store the file in a cloud folder like Google Drive or Dropbox so you always have access to it, even if you change devices."
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
            body: "Recomendamos exportar una copia de seguridad regularmente, especialmente antes de torneos importantes o después de ingresar muchos datos. Para hacerlo, ve a Configuración de Almacenamiento y haz clic en Exportar Copia de Seguridad. Se descargará un archivo .json en tu dispositivo. Guarda ese archivo en un lugar seguro — contiene todo."
        },
        {
            icon: "📥",
            title: "Cómo Restaurar tus Datos",
            body: "Si cambias de dispositivo, usas un navegador diferente, o accidentalmente pierdes tus datos, puedes restaurarlos desde tu archivo de copia de seguridad. Ve a Configuración de Almacenamiento, haz clic en Importar Copia de Seguridad y selecciona tu archivo .json. Tus datos se restaurarán completamente en segundos."
        },
        {
            icon: "🗑️",
            title: "Qué Puede Borrar tus Datos",
            body: "Tus datos pueden perderse si limpias el caché o los datos del sitio desde la configuración de tu navegador. Esto no ocurre de forma automática — tendrías que hacerlo manualmente. Si esto llegara a pasar, puedes restaurar todo desde tu último archivo de copia de seguridad."
        },
        {
            icon: "✅",
            title: "Buenas Prácticas",
            body: "Exporta una copia de seguridad después de cada sesión importante. Guarda el archivo en una carpeta en la nube como Google Drive o Dropbox para que siempre tengas acceso a él, incluso si cambias de dispositivo."
        }
    ]
};

function HelpModal({ onClose }: { onClose: () => void }) {
    const [lang, setLang] = useState<'en' | 'es'>('en');
    const content = lang === 'en' ? helpContentEN : helpContentES;

    return (
        <div className="card">
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
            <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
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
