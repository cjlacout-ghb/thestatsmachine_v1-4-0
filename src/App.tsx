import { useState, useEffect, useCallback, useMemo } from 'react';
import type { AppData, Team, Tournament, Player, Game, TabId } from './types';
import { loadData, saveData } from './lib/storage';

import { TeamsHub } from './components/ui/TeamsHub';
import { Sidebar } from './components/ui/Sidebar';
import { AppHeader } from './components/layout/AppHeader';
import { AppModals } from './components/layout/AppModals';
import type { ModalType } from './components/layout/AppModals';
import { AppContent } from './components/layout/AppContent';
import './index.css';
import { HierarchyStepper } from './components/ui/HierarchyStepper';



function App() {
  const [activeTab, setActiveTab] = useState<TabId>('players');
  const [data, setData] = useState<AppData>({ teams: [], tournaments: [], players: [], games: [] });
  const [activeTeam, setActiveTeam] = useState<Team | null>(null);
  const [activeTournament, setActiveTournament] = useState<Tournament | null>(null);
  const [modalType, setModalType] = useState<ModalType>(null);
  const [editItem, setEditItem] = useState<Team | Tournament | Player | Game | null>(null);

  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [lastSaveTime, setLastSaveTime] = useState<Date | null>(null);
  const [highlightedItemId, setHighlightedItemId] = useState<string | null>(null);


  useEffect(() => {
    const init = async () => {
      const stored = await loadData();
      setData(stored);

      // Restore session
      const savedTeamId = localStorage.getItem('tsm_active_team');
      if (savedTeamId) {
        const team = stored.teams.find(t => t.id === savedTeamId);
        if (team) {
          setActiveTeam(team);
          const savedTourneyId = localStorage.getItem('tsm_active_tournament');
          if (savedTourneyId) {
            const tourney = stored.tournaments.find(t => t.id === savedTourneyId);
            if (tourney && tourney.participatingTeamIds?.includes(team.id)) {
              setActiveTournament(tourney);
            }
          }
        }
      }
    };
    init();
  }, []);



  // Persist session context
  useEffect(() => {
    if (activeTeam) {
      localStorage.setItem('tsm_active_team', activeTeam.id);
    } else {
      localStorage.removeItem('tsm_active_team');
    }

    if (activeTournament) {
      localStorage.setItem('tsm_active_tournament', activeTournament.id);
    } else {
      localStorage.removeItem('tsm_active_tournament');
    }
  }, [activeTeam, activeTournament]);

  // Derived data — memoized to avoid recomputing on every render
  const filteredTournaments = useMemo(
    () => activeTeam ? data.tournaments.filter(t => t.participatingTeamIds?.includes(activeTeam.id)) : [],
    [data.tournaments, activeTeam]
  );

  const filteredPlayers = useMemo(
    () => activeTeam ? data.players.filter(p => p.teamId === activeTeam.id) : [],
    [data.players, activeTeam]
  );

  const filteredGames = useMemo(
    () => activeTournament
      ? data.games.filter(g => g.tournamentId === activeTournament.id)
      : [],
    [data.games, activeTournament]
  );

  // All games for the active team (across all its tournaments) — used by global search
  const searchGames = useMemo(
    () => activeTeam
      ? data.games.filter(g => filteredTournaments.some(t => t.id === g.tournamentId))
      : [],
    [data.games, activeTeam, filteredTournaments]
  );

  // Manual Save Handler
  const handleManualSave = useCallback(async () => {
    setSaveStatus('saving');
    try {
      await saveData(data);
      setSaveStatus('saved');
      setLastSaveTime(new Date());
    } catch (error) {
      console.error('Save failed:', error);
      setSaveStatus('unsaved');
    }
  }, [data]);

  // Handlers
  const handleSaveTeam = useCallback(async (team: Team) => {
    setSaveStatus('saving');
    try {
      const updatedTeams = [...data.teams];
      const idx = updatedTeams.findIndex(t => t.id === team.id);
      if (idx >= 0) updatedTeams[idx] = team;
      else updatedTeams.push(team);

      const newData = { ...data, teams: updatedTeams };
      await saveData(newData);
      setData(newData);
      setActiveTeam(team);
      setModalType(null);
      setEditItem(null);
      setSaveStatus('saved');
      setLastSaveTime(new Date());
    } catch (error) {
      console.error('Save failed:', error);
      alert('Failed to save team changes.');
      setSaveStatus('unsaved');
    }
  }, [data]);

  const handleDeleteTeam = useCallback(async (id: string) => {
    if (window.confirm('Delete this team and all its tournaments, players, and games?')) {
      try {
        // Collect tournament IDs belonging to this team so we can purge their games
        const removedTournamentIds = new Set(
          data.tournaments
            .filter(t => t.participatingTeamIds?.includes(id))
            .map(t => t.id)
        );

        const newData: AppData = {
          ...data,
          teams: data.teams.filter(t => t.id !== id),
          tournaments: data.tournaments.filter(t => !t.participatingTeamIds?.includes(id)),
          players: data.players.filter(p => p.teamId !== id),
          // Remove games that belong to any of the deleted team's tournaments
          games: data.games.filter(g => !removedTournamentIds.has(g.tournamentId)),
        };

        await saveData(newData);
        setData(newData);
        if (activeTeam?.id === id) {
          setActiveTeam(null);
          setActiveTournament(null);
        }

      } catch (error) {
        console.error('Delete failed:', error);
        alert('Failed to delete team.');
      }
    }
  }, [data, activeTeam]);

  const handleSaveTournament = useCallback(async (tournament: Tournament) => {
    const isNew = !editItem;
    setSaveStatus('saving');
    try {
      const updatedTournaments = [...data.tournaments];
      const idx = updatedTournaments.findIndex(t => t.id === tournament.id);
      if (idx >= 0) updatedTournaments[idx] = tournament;
      else updatedTournaments.push(tournament);

      const newData = { ...data, tournaments: updatedTournaments };
      await saveData(newData);
      setData(newData);
      setActiveTournament(tournament);
      setModalType(null);
      setEditItem(null);
      setSaveStatus('saved');
      setLastSaveTime(new Date());
      if (isNew) {
        setActiveTab('players');
      }
    } catch (error) {
      console.error('Save failed:', error);
      alert('Failed to save tournament changes.');
      setSaveStatus('unsaved');
    }
  }, [data, editItem]);

  const handleDeleteTournament = useCallback(async (id: string) => {
    if (confirm('Delete this tournament and all its games? Players will remain in the Team Roster.')) {
      try {
        const newData = { ...data };
        newData.tournaments = newData.tournaments.filter(t => t.id !== id);
        newData.games = newData.games.filter(g => g.tournamentId !== id);

        await saveData(newData);
        setData(newData);
        if (activeTournament?.id === id) {
          setActiveTournament(null);
          setActiveTab('tournaments');
        }

      } catch (error) {
        console.error('Delete failed:', error);
        alert('Failed to delete tournament.');
      }
    }
  }, [data, activeTournament]);

  const handleSavePlayer = useCallback(async (player: Player) => {
    setSaveStatus('saving');
    try {
      const updatedPlayers = [...data.players];
      const idx = updatedPlayers.findIndex(p => p.id === player.id);
      if (idx >= 0) updatedPlayers[idx] = player;
      else updatedPlayers.push(player);

      const newData = { ...data, players: updatedPlayers };
      await saveData(newData);
      setData(newData);
      setModalType(null);
      setEditItem(null);
      setSaveStatus('saved');
      setLastSaveTime(new Date());
    } catch (error) {
      console.error('Save failed:', error);
      alert('Failed to save player changes.');
      setSaveStatus('unsaved');
    }
  }, [data]);

  const handleBulkImportPlayers = useCallback(async (players: Player[]) => {
    try {
      const newData = { ...data };
      newData.players = [...newData.players, ...players];
      await saveData(newData);
      setData(newData);
      setModalType(null);
    } catch (error) {
      console.error('Bulk import failed:', error);
      alert('Failed to import players.');
    }
  }, [data]);

  const handleSaveGame = useCallback(async (game: Game) => {
    setSaveStatus('saving');
    try {
      const updatedGames = [...data.games];
      const idx = updatedGames.findIndex(g => g.id === game.id);
      if (idx >= 0) updatedGames[idx] = game;
      else updatedGames.push(game);

      const newData = { ...data, games: updatedGames };
      await saveData(newData);
      setData(newData);
      setModalType(null);
      setEditItem(null);
      setSaveStatus('saved');
      setLastSaveTime(new Date());
    } catch (error) {
      console.error('Save failed:', error);
      alert('Failed to save game record.');
      setSaveStatus('unsaved');
    }
  }, [data]);

  const handleDeletePlayer = useCallback(async (id: string) => {
    if (confirm('Delete this player? Game stats will be removed.')) {
      try {
        const newData = { ...data };
        newData.players = newData.players.filter(p => p.id !== id);
        newData.games = newData.games.map(g => ({
          ...g,
          playerStats: g.playerStats.filter(ps => ps.playerId !== id)
        }));

        await saveData(newData);
        setData(newData);
        setModalType(null);
        setEditItem(null);
      } catch (error) {
        console.error('Delete failed:', error);
        alert('Failed to delete player.');
      }
    }
  }, [data]);

  const handleDeleteGame = useCallback(async (id: string) => {
    if (confirm('Delete this game record permanently?')) {
      try {
        const newData = { ...data };
        newData.games = newData.games.filter(g => g.id !== id);

        await saveData(newData);
        setData(newData);
        setModalType(null);
        setEditItem(null);
      } catch (error) {
        console.error('Delete failed:', error);
        alert('Failed to delete game.');
      }
    }
  }, [data]);







  const handleImportData = useCallback(async (importedData: AppData) => {
    try {
      const validData: AppData = {
        teams: Array.isArray(importedData.teams) ? importedData.teams : [],
        tournaments: Array.isArray(importedData.tournaments) ? importedData.tournaments : [],
        players: Array.isArray(importedData.players) ? importedData.players : [],
        games: Array.isArray(importedData.games) ? importedData.games : []
      };

      if (validData.teams.length === 0) {
        throw new Error('The file contains no teams.');
      }

      if (data.teams.length > 0) {
        if (!confirm('This will overwrite your existing data. Continue?')) {
          return;
        }
      }

      await saveData(validData);
      setData(validData);
      alert(`Success! Loaded ${validData.teams.length} teams. App will now restart.`);
      window.location.reload();
    } catch (err) {
      console.error('IMPORT FAILED:', err);
      alert('Import Failed: ' + (err as Error).message);
    }
  }, [data]);

  const handleStorageReset = useCallback(async () => {
    const newData = await loadData();
    setData(newData);
    setActiveTeam(null);
    setActiveTournament(null);
  }, []);

  // Entry Point: Teams Hub
  if (!activeTeam) {
    return (
      <div className="app">
        <AppHeader
          activeTeam={activeTeam}
          saveStatus={saveStatus}
          lastSaveTime={lastSaveTime}
          onManualSave={handleManualSave}
          onSwitchTeam={() => setActiveTeam(null)}
          onOpenStorage={() => setModalType('storage')}
          data={data}
          filteredPlayers={filteredPlayers}
          searchGames={searchGames}
          onNavigateSearch={() => { }}
          onOpenHelp={() => setModalType('help')}
        />
        <TeamsHub
          teams={data.teams}
          tournaments={data.tournaments}
          games={data.games}
          onSelectTeam={(team) => {
            setActiveTeam(team);
            setActiveTab('players');
            setActiveTournament(null);
          }}
          onAddTeam={() => setModalType('team')}
          onEditTeam={(team) => { setEditItem(team); setModalType('team'); }}
          onDeleteTeam={(team) => handleDeleteTeam(team.id)}

          onImportData={handleImportData}
          onOpenHelp={() => setModalType('help')}
        />
        <AppModals
          modalType={modalType}
          editItem={editItem}
          activeTeam={activeTeam}
          activeTournament={activeTournament}
          data={data}
          onClose={() => { setModalType(null); setEditItem(null); }}
          onSaveTeam={handleSaveTeam}
          onSaveTournament={handleSaveTournament}
          onSavePlayer={handleSavePlayer}
          onSaveGame={handleSaveGame}
          onSaveGameStats={(gameId, stats) => {
            const updatedGames = data.games.map((g) =>
              g.id === gameId ? { ...g, playerStats: stats } : g
            );
            saveData({ ...data, games: updatedGames });
          }}
          onDeletePlayer={handleDeletePlayer}
          onDeleteGame={handleDeleteGame}
          onBulkImportPlayers={handleBulkImportPlayers}
          onStorageReset={handleStorageReset}
        />
      </div>
    );
  }

  const getCurrentStep = () => {
    if (['team', 'players'].includes(activeTab)) return 1;
    return 2;
  };

  return (
    <div className="app">
      <AppHeader
        activeTeam={activeTeam}
        saveStatus={saveStatus}
        lastSaveTime={lastSaveTime}
        onManualSave={handleManualSave}
        onSwitchTeam={() => setActiveTeam(null)}
        onOpenStorage={() => setModalType('storage')}
        data={data}
        filteredPlayers={filteredPlayers}
        searchGames={searchGames}
        onNavigateSearch={(target) => {
          setHighlightedItemId(target.item.id);
          if (target.type === 'player') {
            setActiveTournament(null);
            // Wait slightly for tab switch before highlighting to ensure DOM is ready
            setTimeout(() => setActiveTab('players'), 0);
          } else {
            setActiveTournament(target.tournament);
            setTimeout(() => setActiveTab('games'), 0);
          }
        }}
        onOpenHelp={() => setModalType('help')}
      />






      <div className="app-container">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={(tab) => {
            setActiveTab(tab);
            setHighlightedItemId(null); // Clear highlight on manual tab change
          }}
          activeTeam={activeTeam}
          activeTournament={activeTournament}
          onExitTournament={() => {
            setActiveTournament(null);
            setActiveTab('tournaments');
            setHighlightedItemId(null);
          }}
          tournaments={filteredTournaments}
          onSelectTournament={(t) => {
            setActiveTournament(t);
            setActiveTab('games');
          }}
        />

        <main className="app-content">
          <HierarchyStepper
            currentStep={getCurrentStep()}
            onStepClick={(s) => {
              if (s === 1) {
                // Go to Organization view
                setActiveTournament(null);
                setActiveTab('team');
              }
              if (s === 2) {
                // Go to Events view
                setActiveTab('tournaments');
              }
            }}
          />

          {/* Persistent Context Header */}
          <div className="dash-header-bar" style={{
            padding: 'var(--space-lg) var(--space-xl)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid var(--border-light)',
            marginBottom: 'var(--space-lg)',
            background: 'var(--bg-card)'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
              <div>
                <h2 className="text-bold" style={{ fontSize: '1.75rem', letterSpacing: '-0.02em' }}>
                  {activeTab === 'team' && 'Team Overview'}
                  {activeTab === 'players' && 'Roster Management'}
                  {activeTab === 'tournaments' && 'Event Management'}
                  {activeTab === 'games' && 'Game Log'}
                  {activeTab === 'stats' && 'Performance Stats'}
                </h2>
              </div>
              <p style={{ color: 'var(--text-muted)', margin: 0 }}>
                {activeTab === 'tournaments' && 'Manage your tournaments and track team performance'}
                {activeTab !== 'tournaments' && 'View and carefully manage your team assets'}
              </p>
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-md)', alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', cursor: 'pointer' }} onClick={() => { setEditItem(activeTeam); setModalType('team'); }}>
                <span style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '2px' }}>Active Team</span>
                <div className="identity-badge" style={{ margin: 0, borderColor: 'var(--border-light)' }}>
                  <div className="identity-icon" style={{ background: 'var(--bg-subtle)' }}>🥎</div>
                  <div className="identity-info">
                    <span className="identity-name">{activeTeam?.name}</span>
                  </div>
                </div>
              </div>

              {activeTournament && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', cursor: 'pointer', marginLeft: '1rem', paddingLeft: '1rem', borderLeft: '1px solid var(--border-light)' }} onClick={() => { setEditItem(activeTournament); setModalType('tournament'); }}>
                  <span style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '2px' }}>Active Event</span>
                  <div className="identity-badge" style={{ margin: 0, borderColor: 'var(--avg)' }}>
                    <div className="identity-icon" style={{ background: 'var(--avg)' }}>🏆</div>
                    <div className="identity-info">
                      <span className="identity-name">{activeTournament.name}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>


          <AppContent
            activeTab={activeTab}
            activeTeam={activeTeam}
            activeTournament={activeTournament}
            data={data}
            filteredTournaments={filteredTournaments}
            filteredPlayers={filteredPlayers}
            filteredGames={filteredGames}
            teamGames={searchGames}
            highlightedItemId={highlightedItemId}
            onSetActiveTab={(tab) => {
              setActiveTab(tab);
              setHighlightedItemId(null);
            }}
            onSetActiveTournament={(t) => {
              setActiveTournament(t);
              setHighlightedItemId(null);
            }}
            onAddPlayer={() => { setEditItem(null); setModalType('player'); }}
            onAddGame={() => { setEditItem(null); setModalType('game'); }}
            onAddTournament={() => { setEditItem(null); setModalType('tournament'); }}
            onEditTeam={(t) => { setEditItem(t); setModalType('team'); }}
            onEditPlayer={(p) => { setEditItem(p); setModalType('player'); }}
            onEditGame={(g) => { setEditItem(g); setModalType('game'); }}
            onEditTournament={(t) => { setEditItem(t); setModalType('tournament'); }}
            onDeleteTeam={(id) => handleDeleteTeam(id)}
            onDeleteTournament={(id) => handleDeleteTournament(id)}
            onOpenPlayerStats={(g) => { setEditItem(g); setModalType('player_stats'); }}
          />

          <AppModals
            modalType={modalType}
            editItem={editItem}
            activeTeam={activeTeam}
            activeTournament={activeTournament}
            data={data}
            onClose={() => { setModalType(null); setEditItem(null); }}
            onSaveTeam={handleSaveTeam}
            onSaveTournament={handleSaveTournament}
            onSavePlayer={handleSavePlayer}
            onSaveGame={handleSaveGame}
            onSaveGameStats={(gameId, stats) => {
              const updatedGames = data.games.map((g) =>
                g.id === gameId ? { ...g, playerStats: stats } : g
              );
              saveData({ ...data, games: updatedGames });
            }}
            onDeletePlayer={handleDeletePlayer}
            onDeleteGame={handleDeleteGame}
            onBulkImportPlayers={handleBulkImportPlayers}
            onStorageReset={handleStorageReset}
          />
        </main>
      </div>
    </div>
  );
}

export default App;
