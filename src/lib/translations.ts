import type { Game, Tournament } from '../types';

export const TRANSLATIONS = {
    gameType: {
        regular: 'temporada regular',
        playoff: 'playoff',
        championship: 'campeonato',
        tournament: 'torneo',
        friendly: 'amistoso'
    },
    condition: {
        REGULAR: 'regular',
        'EXTRA INNINGS': 'extra innings',
        'RUN-AHEAD RULE': 'diferencia de carreras'
    },
    tournamentType: {
        tournament: 'torneo',
        league: 'liga',
        friendly: 'amistoso'
    }
};

export function translateGameType(type: Game['gameType']): string {
    return TRANSLATIONS.gameType[type] || type;
}

export function translateCondition(condition: Game['condition']): string {
    return TRANSLATIONS.condition[condition] || condition;
}

export function translateTournamentType(type: Tournament['type']): string {
    return TRANSLATIONS.tournamentType[type] || type;
}
