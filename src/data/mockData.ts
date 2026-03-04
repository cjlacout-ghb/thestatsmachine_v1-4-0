import type { Team, Player, Tournament, Game } from '../types';

export const mockTeam: Team = {
    id: "mock-team-1",
    name: "Titanes del Diamante",
    description: "Competitive travel team based in Phoenix."
};

export const mockPlayers: Player[] = [
    { id: "p1", teamId: mockTeam.id, name: "Sofia Rodriguez", jerseyNumber: "22", primaryPosition: "SS", secondaryPositions: ["2B"] },
    { id: "p2", teamId: mockTeam.id, name: "Camila Gomez", jerseyNumber: "10", primaryPosition: "CF", secondaryPositions: ["RF"] },
    { id: "p3", teamId: mockTeam.id, name: "Isabella Martinez", jerseyNumber: "5", primaryPosition: "P", secondaryPositions: ["1B"] },
    { id: "p4", teamId: mockTeam.id, name: "Valentina Hernandez", jerseyNumber: "15", primaryPosition: "C", secondaryPositions: ["3B"] },
    { id: "p5", teamId: mockTeam.id, name: "Lucia Diaz", jerseyNumber: "2", primaryPosition: "LF", secondaryPositions: [] }
];

export const mockTournament: Tournament = {
    id: "t1",
    participatingTeamIds: [mockTeam.id],
    name: "Desert Classic 2026",
    startDate: "2026-03-01",
    type: "tournament",
    location: "Arizona State Sports Complex"
};

export const mockGames: Game[] = [
    {
        id: "g1",
        tournamentId: "t1",
        date: "2026-03-01",
        opponent: "Cactus Wolves",
        homeAway: "home",
        gameType: "regular",
        teamScore: 8,
        opponentScore: 3,
        inningsPlayed: 7,
        playerStats: [
            {
                playerId: "p1",
                ab: 4, h: 2, doubles: 1, triples: 0, hr: 0, rbi: 2, r: 1, bb: 0, so: 0, hbp: 0, sb: 1, cs: 0, sac: 0, sf: 0,
                ip: 0, pH: 0, pR: 0, er: 0, pBB: 0, pSO: 0, pHR: 0, pitchCount: 0, po: 2, a: 4, e: 0
            },
            {
                playerId: "p2",
                ab: 3, h: 1, doubles: 0, triples: 0, hr: 0, rbi: 1, r: 2, bb: 1, so: 1, hbp: 0, sb: 2, cs: 0, sac: 0, sf: 0,
                ip: 0, pH: 0, pR: 0, er: 0, pBB: 0, pSO: 0, pHR: 0, pitchCount: 0, po: 3, a: 0, e: 0
            }
        ]
    }
];
