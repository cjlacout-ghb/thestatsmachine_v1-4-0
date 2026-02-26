import type { AppData, Player } from '../types';

/**
 * STORAGE SYSTEM - SIMPLE LOCAL STORAGE VERSION
 * This module handles all data persistence using the browser's localStorage.
 * No drivers, no classes, no complex managers.
 */

// The single constant for localStorage
export const STORAGE_KEY = 'stats_app_data';

// Safe default object used when storage is empty or corrupted
const DEFAULT_DATA: AppData = {
    teams: [],
    tournaments: [],
    players: [],
    games: []
};

/**
 * loadData(): reads and parses JSON from localStorage.
 * If empty or corrupted, returns a safe default object.
 */
export async function loadData(): Promise<AppData> {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return DEFAULT_DATA;

        const parsed = JSON.parse(stored);

        // Ensure all required fields exist in the returned object to prevent app crashes
        return {
            teams: Array.isArray(parsed.teams) ? parsed.teams : [],
            tournaments: Array.isArray(parsed.tournaments) ? parsed.tournaments : [],
            players: Array.isArray(parsed.players) ? parsed.players : [],
            games: Array.isArray(parsed.games) ? parsed.games : []
        };
    } catch (error) {
        console.error('[Storage] Failed to load data:', error);
        return DEFAULT_DATA;
    }
}

/**
 * saveData(data): serializes and writes data to localStorage.
 */
export async function saveData(data: AppData): Promise<void> {
    try {
        const json = JSON.stringify(data);
        localStorage.setItem(STORAGE_KEY, json);

        // Dispatch a custom event so the Header can update its "Last Saved" timestamp
        window.dispatchEvent(new CustomEvent('tsm:data-saved', {
            detail: { timestamp: new Date() }
        }));
    } catch (error) {
        console.error('[Storage] Failed to save data:', error);
        throw new Error('Storage space might be full or unavailable.');
    }
}

/**
 * resetDatabase(): clears the localStorage key entirely.
 */
export async function resetDatabase(): Promise<void> {
    localStorage.removeItem(STORAGE_KEY);

    // Clean up session-related identifiers
    localStorage.removeItem('tsm_active_team');
    localStorage.removeItem('tsm_active_tournament');

    // Full reload to clear app state and start fresh
    window.location.reload();
}

/**
 * UTILITIES
 * These are kept here as they are logic-bound and used across multiple forms.
 */

/**
 * Generates a unique ID for new entities.
 */
export function generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

/**
 * Parses player list text (CSV/Tab) into Player objects.
 */
export function parsePlayerImport(text: string, teamId: string): Player[] {
    const firstLine = text.split('\n')[0] || '';
    const delimiter = firstLine.includes('\t') ? '\t' : ',';

    const rows = text
        .trim()
        .split('\n')
        .map(row => row.split(delimiter).map(cell => cell.trim().replace(/^"|"$/g, '')));

    // First row is always headers — skip it
    const [_headers, ...dataRows] = rows;

    const players: Player[] = [];

    for (const parts of dataRows) {
        if (parts.length >= 2) {
            players.push({
                id: generateId(),
                name: parts[0],
                jerseyNumber: parts[1],
                primaryPosition: (parts[2] as Player['primaryPosition']) || 'DP',
                secondaryPositions: [],
                teamId
            });
        }
    }
    return players;
}
