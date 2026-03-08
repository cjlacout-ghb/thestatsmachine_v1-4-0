export const downloadCSVTemplate = () => {
    const rows = [
        ['Player Name', 'AB', 'H', 'R', 'RBI', 'K', 'BB', 'E'],
        ['Jane Doe', '0', '0', '0', '0', '0', '0', '0'],
        ['Player Two', '0', '0', '0', '0', '0', '0', '0'],
        ['Player Three', '0', '0', '0', '0', '0', '0', '0'],
    ];
    const content = rows.map(r => r.join(',')).join('\n');
    triggerDownload(content, 'player_stats_template.csv', 'text/csv');
};

export const downloadTXTTemplate = () => {
    const rows = [
        ['Player Name', 'AB', 'H', 'R', 'RBI', 'K', 'BB', 'E'],
        ['Jane Doe', '0', '0', '0', '0', '0', '0', '0'],
        ['Player Two', '0', '0', '0', '0', '0', '0', '0'],
        ['Player Three', '0', '0', '0', '0', '0', '0', '0'],
    ];
    const content = rows.map(r => r.join('\t')).join('\n');
    triggerDownload(content, 'player_stats_template.txt', 'text/plain');
};

/**
 * saveJSONWithDialog(data, suggestedFilename)
 *
 * Opens a native OS "Save As" dialog using the File System Access API
 * so the user can choose exactly where to save their backup file.
 *
 * Falls back to a silent browser download for browsers that don't
 * support showSaveFilePicker (e.g. Firefox, Safari).
 *
 * Returns true if the file was saved, false if the user cancelled.
 */
export const saveJSONWithDialog = async (
    data: unknown,
    suggestedFilename: string
): Promise<boolean> => {
    const content = JSON.stringify(data, null, 2);

    // --- File System Access API path (Chrome, Edge, Opera) ---
    if ('showSaveFilePicker' in window) {
        try {
            const fileHandle = await (window as Window & typeof globalThis & {
                showSaveFilePicker: (opts: unknown) => Promise<FileSystemFileHandle>
            }).showSaveFilePicker({
                suggestedName: suggestedFilename,
                types: [
                    {
                        description: 'JSON Backup File',
                        accept: { 'application/json': ['.json'] },
                    },
                ],
            });

            const writable = await fileHandle.createWritable();
            await writable.write(content);
            await writable.close();
            return true;
        } catch (err: unknown) {
            // User pressed Cancel — not an error
            if (err instanceof Error && err.name === 'AbortError') return false;
            console.error('[saveJSONWithDialog] File System API error:', err);
            throw err;
        }
    }

    // --- Fallback: silent download to Downloads folder ---
    triggerDownload(content, suggestedFilename, 'application/json');
    return true;
};


/** Legacy helper used by StorageSettings — silent download to the Downloads folder. */
export const downloadJSON = (data: unknown, filename: string): void => {
    const content = JSON.stringify(data, null, 2);
    triggerDownload(content, filename, 'application/json');
};


// Core engine — mirrors the robust pattern from pdfGenerator.ts exactly
const triggerDownload = (
    content: string,
    filename: string,
    mimeType: string
) => {
    try {
        // 1. Create the Blob — same as doc.output('blob') in pdfGenerator
        const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` });

        // 2. Create the object URL — same as pdfGenerator
        const url = URL.createObjectURL(blob);

        // 3. Trigger the click — same as pdfGenerator
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();

        // 4. Cleanup after delay — same as pdfGenerator
        setTimeout(() => {
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }, 100);

    } catch (e) {
        // Fallback — mirrors the doc.save() fallback in pdfGenerator
        console.error('[fileDownloader] Download failed:', e);
    }
};
