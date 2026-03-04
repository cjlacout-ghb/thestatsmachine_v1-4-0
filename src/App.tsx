import { useState, useEffect, useCallback, useMemo } from 'react';
import type { AppData, Team, Tournament, Player, Game, TabId } from './types';
import { loadData, saveData, saveTeam, deleteTeam, saveTournament, savePlayer, saveGame, deleteTournament, deletePlayer, deleteGame, storageManager, LocalStorageDriver } from './lib/storage';

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
  const [showMigrationBanner, setShowMigrationBanner] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // Initialize and Load data
  useEffect(() => {
    const initApp = async () => {
      await storageManager.init();
      const stored = await storageManager.load();
      setData(stored);

      // Check for legacy migration
      const hasLegacy = await storageManager.hasLegacyData();
      if (hasLegacy) setShowMigrationBanner(true);

      // Restore session context
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
    initApp();

    const handleSaved = (e: any) => setLastSaveTime(e.detail.timestamp);
    window.addEventListener('tsm:data-saved' as any, handleSaved);
    return () => window.removeEventListener('tsm:data-saved' as any, handleSaved);
  }, []);

  // Sync session choices to local storage (metadata only)
  useEffect(() => {
    if (activeTeam) localStorage.setItem('tsm_active_team', activeTeam.id);
    else localStorage.removeItem('tsm_active_team');

    if (activeTournament) localStorage.setItem('tsm_active_tournament', activeTournament.id);
    else localStorage.removeItem('tsm_active_tournament');
  }, [activeTeam, activeTournament]);

  // Derived data
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

  const searchGames = useMemo(
    () => activeTeam
      ? data.games.filter(g => filteredTournaments.some(t => t.id === g.tournamentId))
      : [],
    [data.games, activeTeam, filteredTournaments]
  );


  // CRUD Handlers
  const handleSaveTeam = useCallback(async (team: Team) => {
    setSaveStatus('saving');
    try {
      const newData = await saveTeam(team);
      setData(newData);
      setActiveTeam(team);
      setModalType(null);
      setEditItem(null);
      setSaveStatus('saved');
    } catch (e) {
      setSaveStatus('unsaved');
      alert('Error saving team');
    }
  }, []);

  const handleDeleteTeam = useCallback(async (id: string) => {
    if (confirm('Delete this team and all its nested data?')) {
      const newData = await deleteTeam(id);
      setData(newData);
      if (activeTeam?.id === id) {
        setActiveTeam(null);
        setActiveTournament(null);
      }
    }
  }, [activeTeam]);

  const handleSaveTournament = useCallback(async (tournament: Tournament) => {
    setSaveStatus('saving');
    const newData = await saveTournament(tournament);
    setData(newData);
    setActiveTournament(tournament);
    setModalType(null);
    setEditItem(null);
    setSaveStatus('saved');
  }, []);

  const handleDeleteTournament = useCallback(async (id: string) => {
    if (confirm('Delete tournament?')) {
      const newData = await deleteTournament(id);
      setData(newData);
      if (activeTournament?.id === id) {
        setActiveTournament(null);
      }
    }
  }, [activeTournament]);

  const handleSavePlayer = useCallback(async (player: Player) => {
    const newData = await savePlayer(player);
    setData(newData);
    setModalType(null);
    setEditItem(null);
  }, []);

  const handleBulkImportPlayers = useCallback(async (players: Player[]) => {
    const current = await loadData();
    current.players = [...current.players, ...players];
    await saveData(current);
    setData(current);
    setModalType(null);
  }, []);

  const handleSaveGame = useCallback(async (game: Game) => {
    const newData = await saveGame(game);
    setData(newData);
    setModalType(null);
    setEditItem(null);
  }, []);

  const handleDeletePlayer = useCallback(async (id: string) => {
    if (confirm('Delete player?')) {
      const newData = await deletePlayer(id);
      setData(newData);
    }
  }, []);

  const handleDeleteGame = useCallback(async (id: string) => {
    if (confirm('Delete game record?')) {
      const newData = await deleteGame(id);
      setData(newData);
    }
  }, []);

  const handleImportData = useCallback(async (imported: AppData) => {
    if (data.teams.length > 0 && !confirm('Overwrite all current data?')) return;
    setIsImporting(true);
    try {
      await storageManager.setDriver(new LocalStorageDriver());
      await saveData(imported);
      setData(imported);
      alert('Import successful! App will restart.');
      window.location.reload();
    } catch (e) {
      alert('Import failed');
    } finally {
      setIsImporting(false);
    }
  }, [data]);



  const onSaveToDisk = async () => {
    // PDF or JSON export logic would go here
    return true;
  };

  // Entry Point: Teams Hub
  if (!activeTeam) {
    return (
      <div className="app">
        {data.teams.length > 0 && (
          <AppHeader
            activeTeam={activeTeam}
            saveStatus={saveStatus}
            lastSaveTime={lastSaveTime}
            data={data}
            filteredPlayers={filteredPlayers}
            searchGames={searchGames}
            onNavigateSearch={() => { }}
            onOpenHelp={() => setModalType('help')}
            onSwitchTeam={() => setActiveTeam(null)}
            onSaveToDisk={onSaveToDisk}
            onLoadFromDisk={() => { }}
            onOpenErase={() => setModalType('erase')}
          />
        )}
        <TeamsHub
          teams={data.teams}
          tournaments={data.tournaments}
          games={data.games}
          onSelectTeam={(team) => {
            setActiveTeam(team);
            setActiveTab('players');
          }}
          onAddTeam={() => setModalType('team')}
          onEditTeam={(team) => { setEditItem(team); setModalType('team'); }}
          onDeleteTeam={(team) => handleDeleteTeam(team.id)}
          /* onDemoData eliminado */
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
          onDeletePlayer={handleDeletePlayer}
          onDeleteGame={handleDeleteGame}
          onDeleteTeamConfirm={handleDeleteTeam}
          onBulkImportPlayers={handleBulkImportPlayers}
          onSaveGameStats={() => { }} // Placeholder if not implemented yet
        />
      </div>
    );
  }

  return (
    <div className="app">
      <AppHeader
        activeTeam={activeTeam}
        saveStatus={saveStatus}
        lastSaveTime={lastSaveTime}
        data={data}
        filteredPlayers={filteredPlayers}
        searchGames={searchGames}
        onNavigateSearch={(target) => {
          setHighlightedItemId(target.item.id);
          if (target.type === 'player') {
            setActiveTournament(null);
            setTimeout(() => setActiveTab('players'), 0);
          } else {
            setActiveTournament(target.tournament);
            setTimeout(() => setActiveTab('games'), 0);
          }
        }}
        onOpenHelp={() => setModalType('help')}
        onSwitchTeam={() => setActiveTeam(null)}
        onSaveToDisk={onSaveToDisk}
        onLoadFromDisk={() => { }}
        onOpenErase={() => setModalType('erase')}
      />

      {showMigrationBanner && (
        <div className="banner warning" style={{ textAlign: 'center', padding: '12px' }}>
          ⚠️ You are using browser storage. [Click here] to migrate to a local file for better security.
          <button onClick={() => setShowMigrationBanner(false)} className="btn-link" style={{ marginLeft: '12px' }}>Dismiss</button>
        </div>
      )}

      <div className="app-container">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          activeTeam={activeTeam}
          activeTournament={activeTournament}
          onExitTournament={() => {
            setActiveTournament(null);
            setActiveTab('tournaments');
          }}
        />

        <main className="app-content">
          <HierarchyStepper currentStep={activeTournament ? 2 : 1} />

          <div className="dash-header-bar">
            <h2 className="text-bold">{activeTab.toUpperCase()}</h2>
            <div style={{ display: 'flex', gap: '8px' }}>
              <div className="identity-badge" onClick={() => { setEditItem(activeTeam); setModalType('team'); }}>
                🥎 {activeTeam?.name}
              </div>
              {activeTournament && (
                <div className="identity-badge" onClick={() => { setEditItem(activeTournament); setModalType('tournament'); }} style={{ borderColor: 'var(--avg)' }}>
                  🏆 {activeTournament.name}
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
            onSetActiveTab={setActiveTab}
            onSetActiveTournament={setActiveTournament}
            onAddPlayer={() => { setEditItem(null); setModalType('player'); }}
            onAddGame={() => { setEditItem(null); setModalType('game'); }}
            onAddTournament={() => { setEditItem(null); setModalType('tournament'); }}
            onEditTeam={(t) => { setEditItem(t); setModalType('team'); }}
            onEditPlayer={(p) => { setEditItem(p); setModalType('player'); }}
            onEditGame={(g) => { setEditItem(g); setModalType('game'); }}
            onEditTournament={(t) => { setEditItem(t); setModalType('tournament'); }}
            onDeleteTeam={handleDeleteTeam}
            onDeleteTournament={handleDeleteTournament}
            onOpenPlayerStats={(game) => {
              setEditItem(game);
              setModalType('player_stats');
            }}
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
            onDeletePlayer={handleDeletePlayer}
            onDeleteGame={handleDeleteGame}
            onDeleteTeamConfirm={handleDeleteTeam}
            onBulkImportPlayers={handleBulkImportPlayers}
            onSaveGameStats={() => { }} // Placeholder
          />
        </main>
      </div>
    </div>
  );
}

export default App;
