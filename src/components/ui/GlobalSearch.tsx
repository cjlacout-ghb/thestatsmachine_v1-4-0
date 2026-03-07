import { useState, useRef, useEffect } from 'react';
import type { Player, Game } from '../../types';

interface GlobalSearchProps {
    players: Player[];
    games: Game[];
    onSelectPlayer: (player: Player) => void;
    onSelectGame: (game: Game) => void;
}

export function GlobalSearch({ players, games, onSelectPlayer, onSelectGame }: GlobalSearchProps) {
    const [query, setQuery] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    const searchInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        function handleKeyDown(event: KeyboardEvent) {
            // Check for Cmd+K (Mac) or Ctrl+K (Windows/Linux)
            if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
                event.preventDefault();
                searchInputRef.current?.focus();
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    // Filter Logic
    const filteredPlayers = query.trim()
        ? players.filter(p => p.name.toLowerCase().includes(query.toLowerCase()))
        : [];

    const filteredGames = query.trim()
        ? games.filter(g =>
            g.opponent.toLowerCase().includes(query.toLowerCase()) ||
            g.date.includes(query)
        )
        : [];

    const hasResults = filteredPlayers.length > 0 || filteredGames.length > 0;

    return (
        <div className="global-search" ref={wrapperRef} style={{ position: 'relative', width: '300px' }}>
            <div className="search-input-wrapper" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <span style={{ position: 'absolute', left: '12px', pointerEvents: 'none', opacity: 0.5 }}>🔍</span>
                <input
                    ref={searchInputRef}
                    type="text"
                    className="form-control"
                    placeholder="Buscar jugadores o partidos..."
                    value={query}
                    onChange={e => { setQuery(e.target.value); setIsOpen(true); }}
                    onFocus={() => setIsOpen(true)}
                    style={{ paddingLeft: '36px', paddingRight: '48px', width: '100%' }}
                />
                <div style={{
                    position: 'absolute',
                    right: '12px',
                    pointerEvents: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'var(--bg-subtle)',
                    border: '1px solid var(--border-light)',
                    borderRadius: '4px',
                    padding: '2px 6px',
                    fontSize: '0.65rem',
                    fontWeight: 600,
                    color: 'var(--text-muted)'
                }}>
                    {navigator.platform.toUpperCase().indexOf('MAC') >= 0 ? '⌘K' : 'Ctrl+K'}
                </div>
            </div>

            {isOpen && query.trim() && (
                <div className="search-results" style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    left: 0,
                    right: 0,
                    background: 'var(--bg-card)',
                    borderRadius: 'var(--radius-lg)',
                    boxShadow: 'var(--shadow-lg)',
                    border: '1px solid var(--border-color)',
                    maxHeight: '400px',
                    overflowY: 'auto',
                    zIndex: 1000,
                    padding: '8px 0'
                }}>
                    {!hasResults && (
                        <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                            No se encontraron resultados.
                        </div>
                    )}

                    {filteredPlayers.length > 0 && (
                        <div className="search-section">
                            <div style={{
                                padding: '8px 16px',
                                fontSize: '0.75rem',
                                fontWeight: '700',
                                color: 'var(--text-muted)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em'
                            }}>
                                Jugadores
                            </div>
                            {filteredPlayers.slice(0, 5).map(p => (
                                <button
                                    key={p.id}
                                    onClick={() => { onSelectPlayer(p); setIsOpen(false); setQuery(''); }}
                                    style={{
                                        width: '100%',
                                        textAlign: 'left',
                                        padding: '8px 16px',
                                        background: 'transparent',
                                        border: 'none',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        cursor: 'pointer',
                                        transition: 'background 0.2s'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-card-hover)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                >
                                    <div style={{
                                        width: '32px',
                                        height: '32px',
                                        borderRadius: '50%',
                                        background: 'var(--accent-gradient)',
                                        color: 'white',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '0.75rem'
                                    }}>
                                        {p.jerseyNumber}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: '600', fontSize: '0.9rem', color: 'var(--text-primary)' }}>{p.name}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{p.primaryPosition}</div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}

                    {filteredGames.length > 0 && (
                        <div className="search-section">
                            <div style={{
                                padding: '8px 16px',
                                fontSize: '0.75rem',
                                fontWeight: '700',
                                color: 'var(--text-muted)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                                marginTop: filteredPlayers.length > 0 ? '8px' : '0'
                            }}>
                                Partidos
                            </div>
                            {filteredGames.slice(0, 5).map(g => (
                                <button
                                    key={g.id}
                                    onClick={() => { onSelectGame(g); setIsOpen(false); setQuery(''); }}
                                    style={{
                                        width: '100%',
                                        textAlign: 'left',
                                        padding: '8px 16px',
                                        background: 'transparent',
                                        border: 'none',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        cursor: 'pointer'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-card-hover)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                >
                                    <div style={{ fontSize: '1.25rem' }}>📅</div>
                                    <div>
                                        <div style={{ fontWeight: '600', fontSize: '0.9rem', color: 'var(--text-primary)' }}>vs {g.opponent}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                            {g.date} • <span style={{ textTransform: 'capitalize' }}>{g.homeAway}</span> • <span style={{ textTransform: 'capitalize' }}>{g.gameType}</span>
                                        </div>
                                    </div>
                                    <div style={{ marginLeft: 'auto', fontWeight: '700', fontSize: '0.9rem' }}>
                                        {g.teamScore}-{g.opponentScore}
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
