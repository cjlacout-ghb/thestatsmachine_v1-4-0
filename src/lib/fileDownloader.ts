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

export const downloadJSON = (data: unknown, filename: string) => {
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
        alert(`Could not download ${filename}. Please try again.`);
    }
};
