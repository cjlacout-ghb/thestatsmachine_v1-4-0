import type { AppData, Team, Tournament, Player, Game } from '../types';

/**
 * 🥎 THE STATS MACHINE - ADVANCED STORAGE SYSTEM
 * Dual-driver architecture: LocalStorage + File System Access API
 */

export const STORAGE_KEY = 'stats_app_data';
const DRIVER_PREF_KEY = 'tsm_storage_driver';

const DEFAULT_DATA: AppData = {
    teams: [],
    tournaments: [],
    players: [],
    games: []
};

export interface StorageDriver {
    type: 'local' | 'file';
    load(): Promise<AppData>;
    save(data: AppData): Promise<void>;
}

export class LocalStorageDriver implements StorageDriver {
    type = 'local' as const;

    async load(): Promise<AppData> {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return DEFAULT_DATA;
        try {
            const parsed = JSON.parse(stored);
            return this.validate(parsed);
        } catch (e) {
            console.error('Local load failed:', e);
            return DEFAULT_DATA;
        }
    }

    async save(data: AppData): Promise<void> {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }

    private validate(data: any): AppData {
        return {
            teams: Array.isArray(data.teams) ? data.teams : [],
            tournaments: Array.isArray(data.tournaments) ? data.tournaments : [],
            players: Array.isArray(data.players) ? data.players : [],
            games: Array.isArray(data.games) ? data.games : []
        };
    }
}

class StorageManager {
    private driver: StorageDriver = new LocalStorageDriver();

    async init() {
        // Initializing with LocalStorageDriver by default for now.
        this.driver = new LocalStorageDriver();
    }

    getDriver() {
        return this.driver;
    }

    setDriver(driver: StorageDriver) {
        this.driver = driver;
        localStorage.setItem(DRIVER_PREF_KEY, driver.type);
    }

    async hasLegacyData(): Promise<boolean> {
        const data = await this.load();
        return data.teams.length > 0 && !data.teams[0].id;
    }

    async load(): Promise<AppData> {
        return this.driver.load();
    }

    async save(data: AppData): Promise<void> {
        await this.driver.save(data);
        if (this.driver.type === 'file') {
            localStorage.setItem(STORAGE_KEY + '_mirror', JSON.stringify(data));
        }
        window.dispatchEvent(new CustomEvent('tsm:data-saved', {
            detail: { timestamp: new Date() }
        }));
    }
}

export const storageManager = new StorageManager();

export async function loadData() {
    return storageManager.load();
}

export async function saveData(data: AppData) {
    return storageManager.save(data);
}

export async function saveTeam(team: Team) {
    const data = await loadData();
    const idx = data.teams.findIndex(t => t.id === team.id);
    if (idx >= 0) data.teams[idx] = team;
    else data.teams.push(team);
    await saveData(data);
    return data;
}

export async function deleteTeam(id: string) {
    const data = await loadData();
    const newData: AppData = {
        teams: data.teams.filter(t => t.id !== id),
        tournaments: data.tournaments.filter(t => !t.participatingTeamIds?.includes(id)),
        players: data.players.filter(p => p.teamId !== id),
        games: data.games.filter(g => {
            const t = data.tournaments.find(tour => tour.id === g.tournamentId);
            return t && !t.participatingTeamIds?.includes(id);
        })
    };
    await saveData(newData);
    return newData;
}

export async function saveTournament(tournament: Tournament) {
    const data = await loadData();
    const idx = data.tournaments.findIndex(t => t.id === tournament.id);
    if (idx >= 0) data.tournaments[idx] = tournament;
    else data.tournaments.push(tournament);
    await saveData(data);
    return data;
}

export async function deleteTournament(id: string) {
    const data = await loadData();
    const newData = {
        ...data,
        tournaments: data.tournaments.filter(t => t.id !== id),
        games: data.games.filter(g => g.tournamentId !== id)
    };
    await saveData(newData);
    return newData;
}

export async function savePlayer(player: Player) {
    const data = await loadData();
    const idx = data.players.findIndex(p => p.id === player.id);
    if (idx >= 0) data.players[idx] = player;
    else data.players.push(player);
    await saveData(data);
    return data;
}

export async function deletePlayer(id: string) {
    const data = await loadData();
    const newData = {
        ...data,
        players: data.players.filter(p => p.id !== id),
        games: data.games.map(g => ({
            ...g,
            playerStats: g.playerStats.filter(ps => ps.playerId !== id)
        }))
    };
    await saveData(newData);
    return newData;
}

export async function saveGame(game: Game) {
    const data = await loadData();
    const idx = data.games.findIndex(g => g.id === game.id);
    if (idx >= 0) data.games[idx] = game;
    else data.games.push(game);
    await saveData(data);
    return data;
}

export async function deleteGame(id: string) {
    const data = await loadData();
    const newData = {
        ...data,
        games: data.games.filter(g => g.id !== id)
    };
    await saveData(newData);
    return newData;
}

export async function resetDatabase() {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('tsm_active_team');
    localStorage.removeItem('tsm_active_tournament');
    window.location.reload();
}

export function generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

export function parsePlayerImport(text: string, teamId: string): Player[] {
    const lines = text.trim().split('\n');
    return lines.map(line => {
        const parts = line.split(/[,\t]/).map(s => s.trim());
        return {
            id: generateId(),
            name: parts[0] || 'Unknown Player',
            jerseyNumber: parts[1] || '0',
            primaryPosition: (parts[2] as Player['primaryPosition']) || 'DP',
            secondaryPositions: [],
            teamId
        };
    }).filter(p => p.name !== 'Unknown Player');
}
