// src/lib/downloadFile.ts

export const downloadCSVTemplate = () => {
    // Content is hardcoded here — never undefined, never empty
    const rows = [
        ['Player Name', 'AB', 'H', 'R', 'RBI', 'K', 'BB', 'E'],
        ['Jane Doe', '0', '0', '0', '0', '0', '0', '0'],
        ['Player Two', '0', '0', '0', '0', '0', '0', '0'],
        ['Player Three', '0', '0', '0', '0', '0', '0', '0'],
    ];
    const content = rows.map(r => r.join(',')).join('\n');

    console.log('[DOWNLOAD] CSV content length:', content.length);
    triggerDownload(content, 'player_stats_template.csv', 'text/csv');
};

export const downloadTXTTemplate = () => {
    // Tab-separated — works with Excel and Numbers out of the box
    const rows = [
        ['Player Name', 'AB', 'H', 'R', 'RBI', 'K', 'BB', 'E'],
        ['Jane Doe', '0', '0', '0', '0', '0', '0', '0'],
        ['Player Two', '0', '0', '0', '0', '0', '0', '0'],
        ['Player Three', '0', '0', '0', '0', '0', '0', '0'],
    ];
    const content = rows.map(r => r.join('\t')).join('\n');

    console.log('[DOWNLOAD] TXT content length:', content.length);
    triggerDownload(content, 'player_stats_template.txt', 'text/plain');
};

export const downloadJSON = (data: unknown, filename: string) => {
    const content = JSON.stringify(data, null, 2);

    console.log('[DOWNLOAD] JSON content length:', content.length);
    triggerDownload(content, filename, 'application/json');
};

// Core download engine — used by all functions above
const triggerDownload = (
    content: string,
    filename: string,
    mimeType: string
) => {
    // Guard: never allow empty content through
    if (!content || content.length < 2) {
        console.error('[DOWNLOAD] Aborted — content is empty or undefined');
        return;
    }

    const BOM = '\uFEFF'; // UTF-8 BOM — forces Excel to read UTF-8 correctly
    const blob = new Blob([BOM + content], {
        type: `${mimeType};charset=utf-8;`,
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Delay revoke to ensure Chrome registers the download
    setTimeout(() => URL.revokeObjectURL(url), 500);

    console.log('[DOWNLOAD] Triggered:', filename, '— bytes:', blob.size);
};
