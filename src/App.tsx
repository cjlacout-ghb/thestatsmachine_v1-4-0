import { useState, useEffect, useCallback, useMemo } from 'react';
import type { AppData, Team, Tournament, Player, Game, TabId } from './types';
import { loadData, saveData, saveTeam, deleteTeam, saveTournament, savePlayer, saveGame, deleteTournament, deletePlayer, deleteGame, storageManager, MemoryDriver } from './lib/storage';
import { saveJSONWithDialog } from './lib/fileDownloader';

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

  const [pendingImport, setPendingImport] = useState<AppData | null>(null);

  // Initialize and Load data
  useEffect(() => {
    const initApp = async () => {
      await storageManager.init();
      const stored = await storageManager.load();
      setData(stored);

      // Session context is not restored from localStorage to avoid any browser cache trace.
    };
    initApp();

    const handleSaved = (e: any) => setLastSaveTime(e.detail.timestamp);
    window.addEventListener('tsm:data-saved' as any, handleSaved);
    return () => window.removeEventListener('tsm:data-saved' as any, handleSaved);
  }, []);

  // Session choices are not synced to local storage.
  useEffect(() => {
    // Session is transient.
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

  const filteredGames = useMemo(() => {
    if (!activeTournament) return [];
    const relatedTourneyIds = data.tournaments
      .filter(t => t.name === activeTournament.name)
      .map(t => t.id);
    return data.games.filter(g => relatedTourneyIds.includes(g.tournamentId));
  }, [data.games, data.tournaments, activeTournament]);

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
      setEditItem({ title: 'Error de Guardado', message: 'No se pudo guardar la configuración del equipo. Intentá de nuevo.', type: 'error' } as any);
      setModalType('info');
    }
  }, []);

  const handleDeleteTeam = useCallback((id: string) => {
    const team = data.teams.find(t => t.id === id);
    if (team) {
      setEditItem(team);
      setModalType('delete_team');
    }
  }, [data.teams]);

  const handleConfirmDeleteTeam = useCallback(async (id: string) => {
    const newData = await deleteTeam(id);
    setData(newData);
    setModalType(null);
    setEditItem(null);
    if (activeTeam?.id === id) {
      setActiveTeam(null);
      setActiveTournament(null);
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

  const handleDeleteTournament = useCallback((id: string) => {
    const tourney = data.tournaments.find(t => t.id === id);
    if (tourney) {
      setEditItem(tourney);
      setModalType('delete_tournament');
    }
  }, [data.tournaments]);

  const handleConfirmDeleteTournament = useCallback(async (id: string) => {
    const newData = await deleteTournament(id);
    setData(newData);
    setModalType(null);
    setEditItem(null);
    if (activeTournament?.id === id) {
      setActiveTournament(null);
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

  const handleDeletePlayer = useCallback((id: string) => {
    const player = data.players.find(p => p.id === id);
    if (player) {
      setEditItem(player);
      setModalType('delete_player');
    }
  }, [data.players]);

  const handleConfirmDeletePlayer = useCallback(async (id: string) => {
    const newData = await deletePlayer(id);
    setData(newData);
    setModalType(null);
    setEditItem(null);
  }, []);

  const handleDeleteGame = useCallback((id: string) => {
    const game = data.games.find(g => g.id === id);
    if (game) {
      setEditItem(game);
      setModalType('delete_game');
    }
  }, [data.games]);

  const handleShowAddGame = useCallback(() => {
    if (!activeTournament) {
      if (filteredTournaments.length === 0) {
        setEditItem({
          title: 'Faltan Eventos',
          message: 'Para registrar un partido, primero debes crear un Evento o Torneo al cual pertenezca.',
          type: 'warning'
        } as any);
        setModalType('info');
      } else {
        setEditItem({
          title: 'Seleccioná un Evento',
          message: 'Por favor, seleccioná un Torneo de la lista para poder agregar partidos al mismo.',
          type: 'info'
        } as any);
        setModalType('info');
        setActiveTab('tournaments');
      }
      return;
    }
    setEditItem(null);
    setModalType('game');
  }, [activeTournament, filteredTournaments.length]);

  const handleConfirmDeleteGame = useCallback(async (id: string) => {
    const newData = await deleteGame(id);
    setData(newData);
    setModalType(null);
    setEditItem(null);
  }, []);

  const executeImport = useCallback(async (imported: AppData) => {
    try {
      await storageManager.setDriver(new MemoryDriver());
      await saveData(imported);
      setData(imported);
      setModalType('import_success');
      setPendingImport(null);
    } catch (e) {
      setEditItem({ title: 'Error de Importación', message: 'No se pudieron importar los datos. El formato podría ser incorrecto.', type: 'error' } as any);
      setModalType('info');
    }
  }, []);

  const handleImportData = useCallback(async (imported: AppData) => {
    if (data.teams.length > 0) {
      setPendingImport(imported);
      setModalType('import_confirm');
      return;
    }
    await executeImport(imported);
  }, [data, executeImport]);

  const onSaveToDisk = async () => {
    try {
      const dateStr = new Date().toISOString().split('T')[0];
      const filename = `thestatsmachine_backup_${dateStr}.json`;
      const saved = await saveJSONWithDialog(data, filename);
      if (saved) {
        window.dispatchEvent(new CustomEvent('tsm:data-saved', { detail: { timestamp: new Date() } }));
      }
      return saved;
    } catch (e) {
      console.error('Failed to save to disk:', e);
      return false;
    }
  };

  const onLoadFromDisk = async () => {
    try {
      if ('showOpenFilePicker' in window) {
        const [fileHandle] = await (window as any).showOpenFilePicker({
          types: [{ description: 'Archivo de respaldo JSON', accept: { 'application/json': ['.json'] } }],
        });
        const file = await fileHandle.getFile();
        const text = await file.text();
        const importedData = JSON.parse(text);

        // When importing, if we are in environment that supports FileSystem API, 
        // we keep the driver as FileSystem if the user chosen a file, but here it is a "Load" operation.
        // For simplicity, we set it to MemoryDriver and then user can "Save" to a file.
        await handleImportData(importedData);
      } else {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/json';
        input.onchange = async (e: any) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const text = await file.text();
          try {
            const importedData = JSON.parse(text);
            await handleImportData(importedData);
          } catch (err) {
            setEditItem({ title: 'Archivo Inválido', message: 'El archivo seleccionado no es un respaldo JSON válido.', type: 'error' } as any);
            setModalType('info');
          }
        };
        input.click();
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Failed to load file:', err);
        setEditItem({ title: 'Error de Carga', message: 'Hubo un problema al leer el archivo seleccionado: ' + err.message, type: 'error' } as any);
        setModalType('info');
      }
    }
  };

  // Global navigation logic for HierarchyStepper
  const currentStep: 1 | 2 = (activeTab === 'tournaments' || activeTab === 'games' || (activeTab === 'stats' && activeTournament) || activeTournament) ? 2 : 1;

  const handleStepClick = useCallback((step: number) => {
    if (step === 1) {
      if (activeTournament) setActiveTournament(null);
      setActiveTab('players');
    } else if (step === 2) {
      if (!activeTeam) {
        if (data.teams.length > 0) {
          setActiveTeam(data.teams[0]);
          setActiveTab('tournaments');
        }
        return;
      }
      if (activeTournament) {
        setActiveTab('games');
      } else {
        setActiveTab('tournaments');
      }
    }
  }, [activeTeam, activeTournament, data.teams]);

  // Entry Point: Teams Hub (Selective view)
  if (!activeTeam) {
    return (
      <div className="app">
        {data.teams.length > 0 && (
          <AppHeader
            activeTeam={activeTeam}
            saveStatus={saveStatus}
            lastSaveTime={lastSaveTime}
            onOpenHelp={() => setModalType('help')}
            onSwitchTeam={() => setActiveTeam(null)}
            onSaveToDisk={onSaveToDisk}
            onLoadFromDisk={onLoadFromDisk}
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
          onImportData={handleImportData}
          onOpenHelp={() => setModalType('help')}
          onError={(title, message) => {
            setEditItem({ title, message, type: 'error' } as any);
            setModalType('info');
          }}
          currentStep={currentStep}
          onStepClick={handleStepClick}
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
          onSaveGameStats={() => { }}
          onConfirmImport={() => {
            if (pendingImport) executeImport(pendingImport);
          }}
        />
      </div>
    );
  }

  // Main Dashboard view
  return (
    <div className="app">
      <AppHeader
        activeTeam={activeTeam}
        saveStatus={saveStatus}
        lastSaveTime={lastSaveTime}
        onOpenHelp={() => setModalType('help')}
        onSwitchTeam={() => setActiveTeam(null)}
        onSaveToDisk={onSaveToDisk}
        onLoadFromDisk={onLoadFromDisk}
        onOpenErase={() => setModalType('erase')}
      />



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
          tournaments={filteredTournaments}
          onSelectTournament={(t) => {
            setActiveTournament(t);
            setActiveTab('games');
          }}
        />

        <main className="app-content">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-xl)', gap: 'var(--space-lg)' }}>
            <div className="pro-team-badge" onClick={() => { setEditItem(activeTeam); setModalType('team'); }} style={{ margin: 0 }}>
              <span className="label">EQUIPO OFICIAL</span>
              <span className="name">{activeTeam?.name}</span>
            </div>

            <HierarchyStepper
              currentStep={currentStep}
              onStepClick={handleStepClick}
            />

            {activeTournament ? (
              <div className="identity-badge" onClick={() => { setEditItem(activeTournament); setModalType('tournament'); }} style={{ borderColor: 'var(--avg)', margin: 0 }}>
                🏆 {activeTournament.name}
              </div>
            ) : <div style={{ width: '240px' }} />}
          </div>

          <div className="dash-header-bar">
            <h2 className="text-bold">
              {activeTab === 'players' ? 'JUGADORES' :
                activeTab === 'team' ? 'EQUIPO' :
                  activeTab === 'stats' ? 'ESTADÍSTICAS' :
                    activeTab === 'tournaments' ? 'TORNEOS' :
                      'PARTIDOS'}
            </h2>
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
            onSetActiveTab={setActiveTab}
            onSetActiveTournament={setActiveTournament}
            onAddPlayer={() => { setEditItem(null); setModalType('player'); }}
            onAddGame={handleShowAddGame}
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
            onSwitchTeam={() => setActiveTeam(null)}
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
            onDeletePlayer={handleConfirmDeletePlayer}
            onDeleteGame={handleConfirmDeleteGame}
            onDeleteTournamentConfirm={handleConfirmDeleteTournament}
            onDeleteTeamConfirm={handleConfirmDeleteTeam}
            onBulkImportPlayers={handleBulkImportPlayers}
            onSaveGameStats={() => { }}
            onConfirmImport={() => {
              if (pendingImport) executeImport(pendingImport);
            }}
          />
        </main>
      </div>
    </div>
  );
}

export default App;
