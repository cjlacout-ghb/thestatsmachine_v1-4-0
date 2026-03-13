import type { AppData, Team, Tournament, Player, Game } from '../types';

/**
 * 🥎 THE STATS MACHINE - DIRECT FILE STORAGE SYSTEM
 * Native File System Access API only. No persistent browser cache.
 */

export const STORAGE_KEY = 'stats_app_data';


const DEFAULT_DATA: AppData = {
    teams: [],
    tournaments: [],
    players: [],
    games: []
};

export interface StorageDriver {
    type: 'file';
    load(): Promise<AppData>;
    save(data: AppData): Promise<void>;
}

export class MemoryDriver implements StorageDriver {
    type = 'file' as const;
    private data: AppData = { ...DEFAULT_DATA };

    async load(): Promise<AppData> {
        return this.data;
    }

    async save(data: AppData): Promise<void> {
        this.data = data;
    }
}

export class FileSystemDriver implements StorageDriver {
    type = 'file' as const;
    private handle: FileSystemFileHandle;

    constructor(handle: FileSystemFileHandle) {
        this.handle = handle;
    }

    async load(): Promise<AppData> {
        const file = await this.handle.getFile();
        const text = await file.text();
        return JSON.parse(text);
    }

    async save(data: AppData): Promise<void> {
        const writable = await this.handle.createWritable();
        await writable.write(JSON.stringify(data, null, 2));
        await writable.close();
    }
}

class StorageManager {
    private driver: StorageDriver = new MemoryDriver();


    async init() {
        // We start with MemoryDriver. Data is lost on refresh unless imported/saved to file.
        this.driver = new MemoryDriver();
    }

    getDriver() {
        return this.driver;
    }

    setDriver(driver: StorageDriver) {
        this.driver = driver;
        if (driver instanceof FileSystemDriver) {
            // Keep track if we are using a real file
        }
    }

    isFileActive(): boolean {
        return this.driver instanceof FileSystemDriver;
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

        // Dispatch event only if it's a real file save or meaningful change
        // But the requirement is: "don't show saved if never saved to PC"
        if (this.isFileActive()) {
            window.dispatchEvent(new CustomEvent('tsm:data-saved', {
                detail: { timestamp: new Date() }
            }));
        }
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
    return { ...data, teams: [...data.teams] };
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
    const newTournaments = [...data.tournaments];
    if (idx >= 0) newTournaments[idx] = tournament;
    else newTournaments.push(tournament);
    
    const newData = { ...data, tournaments: newTournaments };
    await saveData(newData);
    return newData;
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
    const newPlayers = [...data.players];
    if (idx >= 0) newPlayers[idx] = player;
    else newPlayers.push(player);
    
    const newData = { ...data, players: newPlayers };
    await saveData(newData);
    return newData;
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
    const newGames = [...data.games];
    if (idx >= 0) newGames[idx] = game;
    else newGames.push(game);
    
    const newData = { ...data, games: newGames };
    await saveData(newData);
    return newData;
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
    // Only memory exists now
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
