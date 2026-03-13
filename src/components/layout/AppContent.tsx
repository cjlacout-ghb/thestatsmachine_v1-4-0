import type { Team, Tournament, Player, Game, AppData, TabId } from '../../types';
import { PlayersTab } from '../tabs/PlayersTab';
import { TournamentsTab } from '../tabs/TournamentsTab';
import { TeamTab } from '../tabs/TeamTab';
import { GamesTab } from '../tabs/GamesTab';
import { StatsTab } from '../tabs/StatsTab';

interface AppContentProps {
    activeTab: TabId;
    activeTeam: Team | null;
    activeTournament: Tournament | null;
    data: AppData;
    filteredTournaments: Tournament[];
    filteredPlayers: Player[];
    filteredGames: Game[]; // Contextual games (Active Tournament)
    teamGames: Game[]; // All games for active team
    highlightedItemId?: string | null;

    // Actions
    onSetActiveTab: (tab: TabId) => void;
    onSetActiveTournament: (t: Tournament | null) => void;
    onAddPlayer: () => void;
    onAddGame: (t?: Tournament) => void;
    onAddTournament: () => void;
    onEditTeam: (t: Team) => void;
    onEditPlayer: (p: Player) => void;
    onEditGame: (g: Game) => void;
    onEditTournament: (t: Tournament) => void;
    onDeleteTeam: (id: string) => void;
    onDeleteTournament: (id: string) => void;
    onDeleteGame: (id: string) => void;
    onOpenPlayerStats: (g: Game) => void;
}

export function AppContent({
    activeTab,
    activeTeam,
    activeTournament,
    data,
    filteredTournaments,
    filteredPlayers,
    filteredGames,
    teamGames,
    highlightedItemId,
    onSetActiveTab,
    onSetActiveTournament,
    onAddPlayer,
    onAddGame,
    onAddTournament,
    onEditTeam,
    onEditPlayer,
    onEditGame,
    onEditTournament,
    onDeleteTeam,
    onDeleteTournament,
    onDeleteGame,
    onOpenPlayerStats
}: AppContentProps) {

    const renderTab = () => {
        switch (activeTab) {
            case 'players':
                return (
                    <PlayersTab
                        players={filteredPlayers}
                        games={teamGames}
                        onSelectPlayer={onEditPlayer}
                        onAddPlayer={onAddPlayer}
                        highlightedItemId={highlightedItemId}
                    />
                );
            case 'tournaments':
                return (
                    <TournamentsTab
                        tournaments={filteredTournaments}
                        games={data.games}
                        teams={data.teams}
                        onSelectTournament={(t) => {
                            onSetActiveTournament(t);
                            onSetActiveTab('games');
                        }}
                        onAddTournament={onAddTournament}
                        onEditTournament={onEditTournament}
                        onDeleteTournament={(t) => onDeleteTournament(t.id)}
                        onAddGameToTournament={(t) => {
                            onSetActiveTournament(t);
                            onAddGame(t);
                        }}
                        onViewStats={(t) => {
                            onSetActiveTournament(t);
                            onSetActiveTab('stats');
                        }}
                    />
                );
            case 'team':
                return (
                    <TeamTab
                        games={teamGames}
                        players={filteredPlayers}
                        team={activeTeam}
                        onAddGame={() => { onSetActiveTab('tournaments'); }}
                        onAddPlayer={onAddPlayer}
                        onManageRoster={() => onSetActiveTab('players')}
                        onEditTeam={onEditTeam}
                        onDeleteTeam={onDeleteTeam}
                    />
                );
            case 'games':
                return (
                    <GamesTab
                        games={filteredGames}
                        players={filteredPlayers}
                        tournament={activeTournament}
                        onSelectGame={onEditGame}
                        onAddGame={onAddGame}
                        onEditTournament={onEditTournament}
                        onDeleteTournament={onDeleteTournament}
                        onDeleteGame={onDeleteGame}
                        onOpenPlayerStats={onOpenPlayerStats}
                        teamName={activeTeam?.name}
                        highlightedItemId={highlightedItemId}
                    />
                );
            case 'stats':
                return (
                    <StatsTab
                        games={activeTournament ? filteredGames : teamGames}
                        players={data.players}
                        teams={data.teams}
                        tournaments={data.tournaments}
                        tournament={activeTournament}
                        activeTeamName={activeTeam?.name}
                        onAddGame={onAddGame}
                        onAddPlayer={onAddPlayer}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <div className="app-content-body">
            {renderTab()}
        </div>
    );
}
