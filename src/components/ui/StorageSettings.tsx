import { useState } from 'react';
import { loadData, saveData, resetDatabase } from '../../lib/storage';
import { downloadJSON } from '../../lib/fileDownloader';

interface StorageSettingsProps {
    onStorageChange: () => void;
    onClose: () => void;
}

/**
 * StorageSettings Component
 * Provides UI for manual data backup (Export/Import) and a Danger Zone for resetting.
 * Simplified to remove the complex driver/file-system logic.
 */
export function StorageSettings({ onStorageChange, onClose }: StorageSettingsProps) {
    const [isResetting, setIsResetting] = useState(false);
    const [resetValidationText, setResetValidationText] = useState('');

    /**
     * handleManualExport(): Downloads the current app data as a .json file.
     */
    const handleManualExport = async () => {
        try {
            const data = await loadData();
            downloadJSON(
                data,
                `stats_backup_${new Date().toISOString().split('T')[0]}.json`
            );
        } catch (err) {
            console.error('Export failed:', err);
            alert('Failed to export data.');
        }
    };

    /**
     * handleManualImport(): Reads a .json file and replaces current localStorage data.
     */
    const handleManualImport = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = async (event) => {
                try {
                    const content = event.target?.result as string;
                    const data = JSON.parse(content);

                    // Simple validation: check if it has a teams array
                    if (!data.teams || !Array.isArray(data.teams)) {
                        throw new Error('Invalid data structure: Missing teams array.');
                    }

                    if (confirm('Import data from file? This will overwrite your current application data.')) {
                        await saveData(data);
                        onStorageChange();
                        // Trigger a reload to ensure all components see the new data
                        window.location.reload();
                    }
                } catch (err) {
                    console.error('Import failed:', err);
                    alert('Invalid file format. Please select a valid stats JSON file.');
                }
            };
            reader.readAsText(file);
        };
        input.click();
    };

    return (
        <div className="modal-content" style={{ minWidth: '450px' }}>
            <div className="modal-header">
                <h3>Storage & Backup</h3>
                <p>Manage your data and keep safe copies on your device.</p>
            </div>

            <div className="modal-body">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>

                    {/* SECTION 1 — BACKUP TOOLS */}
                    <div className="card" style={{ padding: 'var(--space-lg)', borderStyle: 'dashed' }}>
                        <h4 className="text-bold mb-xs" style={{ fontSize: '1rem' }}>Data Backup</h4>
                        <p className="text-muted mb-md" style={{ fontSize: '0.8125rem' }}>
                            Export your data regularly to keep a safe copy on your device.
                        </p>

                        <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
                            <button
                                className="btn btn-secondary"
                                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px' }}
                                onClick={handleManualExport}
                            >
                                📤 Export Backup
                            </button>
                            <button
                                className="btn btn-secondary"
                                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px' }}
                                onClick={handleManualImport}
                            >
                                📥 Import Backup
                            </button>
                        </div>
                    </div>

                    {/* SECTION 2 — DANGER ZONE */}
                    <div className="card" style={{
                        padding: 'var(--space-lg)',
                        border: '2px solid var(--danger-color)',
                        background: 'color-mix(in srgb, var(--danger-color) 5%, transparent)'
                    }}>
                        <h4 className="text-bold mb-md" style={{ fontSize: '0.9rem', color: 'var(--danger-color)' }}>Danger Zone</h4>

                        {!isResetting ? (
                            <button
                                className="btn"
                                style={{
                                    width: '100%',
                                    backgroundColor: 'var(--danger-color)',
                                    color: 'white',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}
                                onClick={() => setIsResetting(true)}
                            >
                                ⚠️ Erase All Data (Start Fresh)
                            </button>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                                <p style={{ fontSize: '0.8125rem', color: 'var(--danger-color)', fontWeight: '500' }}>
                                    Warning: You are about to permanently erase all Teams, Players, Tournaments, and Games.
                                    This action CANNOT be undone.
                                </p>
                                <p style={{ fontSize: '0.8125rem' }}>
                                    Type <strong>RESET</strong> to confirm.
                                </p>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={resetValidationText}
                                    onChange={(e) => setResetValidationText(e.target.value)}
                                    placeholder="Type RESET here"
                                    style={{ border: '1px solid var(--danger-color)' }}
                                    autoFocus
                                />
                                <div style={{ display: 'flex', gap: 'var(--space-sm)', marginTop: 'var(--space-sm)' }}>
                                    <button
                                        className="btn btn-secondary"
                                        style={{ flex: 1 }}
                                        onClick={() => {
                                            setIsResetting(false);
                                            setResetValidationText('');
                                        }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        className="btn"
                                        style={{
                                            flex: 1,
                                            backgroundColor: resetValidationText === 'RESET' ? 'var(--danger-color)' : 'color-mix(in srgb, var(--danger-color) 50%, transparent)',
                                            color: 'white',
                                            cursor: resetValidationText === 'RESET' ? 'pointer' : 'not-allowed'
                                        }}
                                        disabled={resetValidationText !== 'RESET'}
                                        onClick={async () => {
                                            if (resetValidationText === 'RESET') {
                                                await resetDatabase();
                                            }
                                        }}
                                    >
                                        Confirm Erase Data
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="modal-footer">
                <button className="btn btn-primary" style={{ width: '100%' }} onClick={onClose}>Close</button>
            </div>
        </div>
    );
}
