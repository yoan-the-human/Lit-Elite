import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import { getInitialGameState, draftNormalSubsection, draftEliteCard, selectFinalElites, playNormalCard, playEliteCard, playUnderlayAce, executeCombat, executeAttackPlayer, endTurn } from './game/gameEngine';
import { runAiGameplayTurn, getAiNormalDraftChoice, getAiEliteDraftChoice } from './game/aiOpponent';
import DraftPhase from './components/DraftPhase';
import EliteDraftPhase from './components/EliteDraftPhase';
import GameBoard from './components/GameBoard';
import GameLogs from './components/GameLogs';
import TurnOverlay from './components/TurnOverlay';
import { io } from 'socket.io-client';
import { TRANSLATIONS } from './game/translations';

// Synthetic sound player
function playSound(type) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    const now = ctx.currentTime;
    if (type === 'draw') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(320, now + 0.12);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
      osc.start(now);
      osc.stop(now + 0.12);
    } else if (type === 'play') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(800, now + 0.16);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.16);
      osc.start(now);
      osc.stop(now + 0.16);
    } else if (type === 'attack') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(100, now);
      osc.frequency.linearRampToValueAtTime(30, now + 0.25);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    } else if (type === 'heal') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
      osc.frequency.setValueAtTime(783.99, now + 0.16); // G5
      osc.frequency.setValueAtTime(1046.50, now + 0.24); // C6
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);
      osc.start(now);
      osc.stop(now + 0.45);
    } else if (type === 'win') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(261.63, now); // C4
      osc.frequency.setValueAtTime(329.63, now + 0.15); // E4
      osc.frequency.setValueAtTime(392.00, now + 0.3); // G4
      osc.frequency.setValueAtTime(523.25, now + 0.45); // C5
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.9);
      osc.start(now);
      osc.stop(now + 0.9);
    }
  } catch (e) {
    // Fail silently if context is blocked/unsupported
  }
}

export default function App() {
  const [gameState, setGameState] = useState(null);
  const [isTurnHandoffActive, setIsTurnHandoffActive] = useState(false);
  const [showAiFirstChoice, setShowAiFirstChoice] = useState(false);
  const [language, setLanguage] = useState('en');
  const [socket, setSocket] = useState(null);
  const [roomCode, setRoomCode] = useState('');
  const [onlineRole, setOnlineRole] = useState(null);
  const [onlineStatus, setOnlineStatus] = useState('idle'); // 'idle', 'connecting', 'connected', 'waiting', 'error'
  const [lobbyCodeInput, setLobbyCodeInput] = useState('');
  const [serverUrl, setServerUrl] = useState('https://lit-elite-server.onrender.com');
  const [lobbyView, setLobbyView] = useState('menu'); // 'menu', 'create', 'join'
  const [isRoomPrivate, setIsRoomPrivate] = useState(true);
  const [publicRooms, setPublicRooms] = useState([]);

  const socketRef = useRef(null);
  const roomCodeRef = useRef('');
  socketRef.current = socket;
  roomCodeRef.current = roomCode;

  // Cleanup socket on unmount
  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  // Trigger sound when card counts change (for draws) or logs update
  useEffect(() => {
    if (!gameState) return;
    const lastLog = gameState.logs[gameState.logs.length - 1] || '';
    
    if (lastLog.includes('draws a card') || lastLog.includes('draws Elite') || lastLog.includes('symmetrical draw')) {
      playSound('draw');
    } else if (lastLog.includes('Plays Normal Card') || lastLog.includes('Plays Elite Card') || lastLog.includes('Underlays')) {
      playSound('play');
    } else if (lastLog.includes('attacks') || lastLog.includes('damage') || lastLog.includes('detonates')) {
      playSound('attack');
    } else if (lastLog.includes('healed') || lastLog.includes('resurrected') || lastLog.includes('restore')) {
      playSound('heal');
    } else if (lastLog.includes('Game Over')) {
      playSound('win');
    }
  }, [gameState?.logs?.length]);

  // Connect to room server and register events
  const connectToLobby = (url) => {
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
    setOnlineStatus('connecting');
    const targetUrl = url || (window.location.hostname === 'localhost' ? 'http://localhost:3001' : 'https://lit-elite-server.onrender.com');
    const newSocket = io(targetUrl, {
      transports: ['websocket'],
      timeout: 5000
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    newSocket.on('connect', () => {
      setOnlineStatus('lobby');
      setLobbyView('menu');
      newSocket.emit('join_lobby');
    });

    newSocket.on('connect_error', () => {
      setOnlineStatus('error');
      newSocket.disconnect();
      setSocket(null);
      socketRef.current = null;
    });

    newSocket.on('public_rooms_list', (list) => {
      setPublicRooms(list);
    });

    newSocket.on('room_created', ({ code, isPrivate }) => {
      roomCodeRef.current = code;
      setRoomCode(code);
      setIsRoomPrivate(isPrivate);
      setOnlineRole('A');
      setOnlineStatus('waiting');
    });

    newSocket.on('room_joined', ({ code, role }) => {
      roomCodeRef.current = code;
      setRoomCode(code);
      setOnlineRole(role);
      setOnlineStatus('connected');
    });

    newSocket.on('player_joined', ({ role }) => {
      setOnlineStatus('connected');
      const startingPlayer = Math.random() < 0.5 ? 'A' : 'B';
      const initialMsg = `Coin flipped: ${startingPlayer === 'A' ? 'Player 1 (A)' : 'Player 2 (B)'} goes first!`;
      const state = getInitialGameState('online', startingPlayer);
      state.logs.push(initialMsg);
      setGameState(state);
      newSocket.emit('update_state', { code: roomCodeRef.current, state });
    });

    newSocket.on('state_updated', (newState) => {
      setGameState(newState);
    });

    newSocket.on('room_error', (msg) => {
      alert(msg);
      setOnlineStatus('lobby');
      setLobbyView('menu');
      newSocket.emit('join_lobby');
    });

    newSocket.on('player_left', () => {
      alert('Opponent disconnected! The game lobby has been closed.');
      handleResetToMenu();
    });
  };

  const updateAndSyncState = (updaterFn) => {
    setGameState(prev => {
      const next = updaterFn(prev);
      if (socketRef.current && roomCodeRef.current) {
        socketRef.current.emit('update_state', { code: roomCodeRef.current, state: next });
      }
      return next;
    });
  };

  // Start game action
  const handleStartGame = (mode, forcedStartingPlayer = null) => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      setSocket(null);
      socketRef.current = null;
    }
    setRoomCode('');
    setOnlineRole(null);
    setOnlineStatus('idle');

    let startingPlayer = forcedStartingPlayer;
    let methodMsg = "";
    if (mode === 'ai') {
      if (!startingPlayer) {
        startingPlayer = Math.random() < 0.5 ? 'A' : 'B';
        methodMsg = `Coin flipped: ${startingPlayer === 'A' ? 'Player A' : 'Computer (AI)'} goes first!`;
      } else {
        methodMsg = `${startingPlayer === 'A' ? 'Player A' : 'Computer (AI)'} starts the draft.`;
      }
    } else {
      startingPlayer = Math.random() < 0.5 ? 'A' : 'B';
      methodMsg = `Coin flipped: ${startingPlayer === 'A' ? 'Player A' : 'Player B'} goes first!`;
    }
    const state = getInitialGameState(mode, startingPlayer);
    
    state.logs.push(methodMsg);
    setGameState(state);
    setShowAiFirstChoice(false);
  };

  // Draft Phase Actions
  const handleSelectSubsection = (subId) => {
    updateAndSyncState(prev => draftNormalSubsection(structuredClone(prev), subId));
  };

  const handleDraftElite = (cardId) => {
    updateAndSyncState(prev => draftEliteCard(structuredClone(prev), cardId));
  };

  const handleSelectFinalElites = (player, cardIds) => {
    updateAndSyncState(prev => selectFinalElites(structuredClone(prev), player, cardIds));
  };

  // Gameplay actions
  const handlePlayNormal = (cardId, powerIdx, targetInfo) => {
    updateAndSyncState(prev => playNormalCard(structuredClone(prev), cardId, powerIdx, targetInfo));
  };

  const handlePlayElite = (cardId, abilityIdx, extraParams) => {
    updateAndSyncState(prev => playEliteCard(structuredClone(prev), cardId, abilityIdx, extraParams));
  };

  const handlePlayUnderlay = (aceId, targetEliteId, abilityIdx, extraParams) => {
    updateAndSyncState(prev => playUnderlayAce(structuredClone(prev), aceId, targetEliteId, abilityIdx, extraParams));
  };

  const handleCombat = (attackerId, defenderId) => {
    updateAndSyncState(prev => executeCombat(structuredClone(prev), attackerId, defenderId));
  };

  const handleAttackPlayer = (attackerId) => {
    updateAndSyncState(prev => executeAttackPlayer(structuredClone(prev), attackerId));
  };

  const handleEndTurn = () => {
    updateAndSyncState(prev => {
      const next = structuredClone(prev);
      const updated = endTurn(next);
      
      // Trigger hider block screen if hotseat mode
      if (updated.mode === 'hotseat' && updated.phase === 'GAMEPLAY' && !updated.winner) {
        setIsTurnHandoffActive(true);
      }
      
      return updated;
    });
  };

  // AI drafting and gameplay automated loop
  useEffect(() => {
    if (!gameState || gameState.winner || gameState.phase === 'GAME_OVER') return;

    // AI normal drafting
    if (gameState.phase === 'DRAFT_NORMAL' && gameState.draft.currentDrafter === 'B' && gameState.mode === 'ai') {
      const timer = setTimeout(() => {
        const choice = getAiNormalDraftChoice(gameState);
        if (choice) handleSelectSubsection(choice);
      }, 1000);
      return () => clearTimeout(timer);
    }

    // AI elite drafting
    if (gameState.phase === 'DRAFT_ELITE' && gameState.draft.currentDrafter === 'B' && gameState.mode === 'ai') {
      const timer = setTimeout(() => {
        const choice = getAiEliteDraftChoice(gameState);
        if (choice) handleDraftElite(choice);
      }, 1000);
      return () => clearTimeout(timer);
    }

    // AI gameplay turn
    if (gameState.phase === 'GAMEPLAY' && gameState.activePlayer === 'B' && gameState.mode === 'ai') {
      const timer = setTimeout(() => {
        runAiGameplayTurn(structuredClone(gameState), (updatedState) => {
          // If the AI switched active player to 'A', check if handoff hider is needed
          if (updatedState.activePlayer === 'A' && updatedState.mode === 'hotseat') {
            setIsTurnHandoffActive(true);
          }
          setGameState(updatedState);
        });
      }, 3000); // 3s delay for AI thinking feel
      return () => clearTimeout(timer);
    }
  }, [gameState]);

  // Handoff ready handler
  const handleConfirmReady = () => {
    setIsTurnHandoffActive(false);
  };

  // Return to menu
  const handleResetToMenu = () => {
    if (socketRef.current) {
      socketRef.current.emit('leave_lobby');
      socketRef.current.disconnect();
    }
    setSocket(null);
    socketRef.current = null;
    setRoomCode('');
    setOnlineRole(null);
    setOnlineStatus('idle');
    setGameState(null);
    setIsTurnHandoffActive(false);
    setLobbyView('menu');
    setPublicRooms([]);
  };

  const handleCancelWaiting = () => {
    if (socketRef.current && roomCodeRef.current) {
      socketRef.current.emit('leave_room', { code: roomCodeRef.current });
    }
    handleResetToMenu();
  };

  const handlePlayAgain = () => {
    if (gameState.mode === 'online') {
      if (onlineRole === 'A') {
        const startingPlayer = Math.random() < 0.5 ? 'A' : 'B';
        const initialMsg = `Game Restarted! Coin flipped: ${startingPlayer === 'A' ? 'Player 1 (A)' : 'Player 2 (B)'} goes first!`;
        const state = getInitialGameState('online', startingPlayer);
        state.logs.push(initialMsg);
        setGameState(state);
        if (socketRef.current && roomCodeRef.current) {
          socketRef.current.emit('update_state', { code: roomCodeRef.current, state });
        }
      } else {
        alert('Waiting for Player 1 (A) to restart the game...');
      }
    } else {
      handleStartGame(gameState.mode);
    }
  };

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'bg' : 'en');
  };

  const renderLanguageToggle = (inGame = false) => (
    <button 
      onClick={toggleLanguage} 
      className="btn-premium" 
      style={inGame ? { 
        position: 'absolute', 
        top: '12px', 
        right: '360px', 
        zIndex: 1000, 
        padding: '6px 12px', 
        fontSize: '0.8rem',
        minWidth: 'auto',
        background: 'rgba(255, 255, 255, 0.07)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: '6px'
      } : { 
        position: 'absolute', 
        top: '20px', 
        right: '20px', 
        zIndex: 1000, 
        padding: '8px 16px', 
        fontSize: '0.85rem',
        minWidth: 'auto',
        background: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}
    >
      {language === 'en' ? '🇧🇬 BG' : '🇺🇸 EN'}
    </button>
  );

  const stateForRender = gameState ? { ...gameState, onlineRole } : null;

  // 1. Welcome scene
  if (!gameState) {
    const t = TRANSLATIONS[language] || TRANSLATIONS.en;
    return (
      <div className="welcome-screen">
        {renderLanguageToggle(false)}
        <h1 className="welcome-logo">{t.title}</h1>
        <p className="welcome-subtitle">
          {t.subtitle}
        </p>
        
        {showAiFirstChoice ? (
          <div className="glass-panel mode-card" style={{ maxWidth: '500px', width: '100%', cursor: 'default' }}>
            <h3 style={{ marginBottom: '16px', color: 'var(--text-bright)' }}>{t.whoDraftsFirst}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button className="btn-premium btn-spades" style={{ justifyContent: 'center' }} onClick={() => handleStartGame('ai', 'A')}>
                {t.iDraftFirst}
              </button>
              <button className="btn-premium btn-hearts" style={{ justifyContent: 'center' }} onClick={() => handleStartGame('ai', 'B')}>
                {t.aiDraftsFirst}
              </button>
              <button className="btn-premium btn-diamonds" style={{ justifyContent: 'center' }} onClick={() => handleStartGame('ai', null)}>
                {t.coinFlip}
              </button>
              <button className="btn-premium btn-clubs" style={{ marginTop: '8px', justifyContent: 'center' }} onClick={() => setShowAiFirstChoice(false)}>
                {t.back}
              </button>
            </div>
          </div>
        ) : onlineStatus !== 'idle' ? (
          <div className="glass-panel mode-card" style={{ maxWidth: '520px', width: '100%', cursor: 'default' }}>
            {onlineStatus === 'lobby' ? (
              <>
                <h3 style={{ marginBottom: '16px', color: 'var(--text-bright)' }}>{t.onlineMode}</h3>
                
                {lobbyView === 'menu' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'left' }}>
                      <label style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Server URL:</label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input 
                          type="text" 
                          value={serverUrl} 
                          onChange={(e) => setServerUrl(e.target.value)}
                          className="lobby-input"
                          style={{
                            background: 'rgba(0, 0, 0, 0.3)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '6px',
                            padding: '6px 10px',
                            color: 'var(--text-bright)',
                            fontSize: '0.85rem',
                            flex: 1
                          }}
                        />
                        <button 
                          className="btn-premium" 
                          style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                          onClick={() => connectToLobby(serverUrl)}
                        >
                          Reconnect
                        </button>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px', textAlign: 'left', minHeight: '220px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderRight: '1px solid rgba(255,255,255,0.08)', paddingRight: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <span style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-bright)' }}>{t.publicRoomsTitle}</span>
                          <button 
                            className="btn-premium" 
                            style={{ padding: '2px 8px', fontSize: '0.75rem', minWidth: 'auto', background: 'rgba(255,255,255,0.05)' }}
                            onClick={() => socket?.emit('get_public_rooms')}
                          >
                            🔄 {t.refreshBtn}
                          </button>
                        </div>
                        <div style={{ overflowY: 'auto', flex: 1, maxHeight: '200px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {publicRooms.length === 0 ? (
                            <div style={{ color: 'var(--text-dim)', fontSize: '0.8rem', fontStyle: 'italic', padding: '20px 0', textAlign: 'center' }}>
                              {t.noPublicRooms}
                            </div>
                          ) : (
                            publicRooms.map((room) => (
                              <div 
                                key={room.code}
                                className="choice-row-btn"
                                onClick={() => socket?.emit('join_room', { code: room.code })}
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  padding: '8px 12px',
                                  background: 'rgba(255, 255, 255, 0.03)',
                                  border: '1px solid rgba(255, 255, 255, 0.05)',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  transition: 'background 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'}
                              >
                                <div>
                                  <span style={{ fontWeight: '700', color: 'var(--color-clubs)' }}>#{room.code}</span>
                                  <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>{t.clickToJoin}</div>
                                </div>
                                <span style={{ fontSize: '0.8rem', background: 'rgba(16, 185, 129, 0.2)', color: 'var(--color-clubs)', padding: '2px 6px', borderRadius: '4px' }}>
                                  {room.playersCount}/2 Players
                                </span>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', justifyContent: 'center' }}>
                        <button 
                          className="btn-premium btn-clubs" 
                          style={{ justifyContent: 'center' }}
                          onClick={() => setLobbyView('create')}
                        >
                          {t.createLobby}
                        </button>
                        <button 
                          className="btn-premium btn-diamonds" 
                          style={{ justifyContent: 'center' }}
                          onClick={() => setLobbyView('join')}
                        >
                          {t.joinLobby}
                        </button>
                        <button 
                          className="btn-premium" 
                          style={{ justifyContent: 'center' }}
                          onClick={handleResetToMenu}
                        >
                          {t.back}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : lobbyView === 'create' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
                    <h4 style={{ color: 'var(--text-bright)', fontSize: '1rem', textAlign: 'left' }}>{t.createLobby}</h4>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'left' }}>
                      <label style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>{t.roomTypeLabel}</label>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label 
                          style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '10px', 
                            padding: '10px', 
                            background: !isRoomPrivate ? 'rgba(16, 185, 129, 0.08)' : 'rgba(0,0,0,0.2)', 
                            border: !isRoomPrivate ? '1px solid var(--color-clubs)' : '1px solid rgba(255,255,255,0.05)',
                            borderRadius: '6px',
                            cursor: 'pointer'
                          }}
                        >
                          <input 
                            type="radio" 
                            name="roomType" 
                            checked={!isRoomPrivate} 
                            onChange={() => setIsRoomPrivate(false)} 
                          />
                          <span style={{ fontWeight: '700', fontSize: '0.85rem' }}>{t.publicRoom}</span>
                        </label>

                        <label 
                          style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '10px', 
                            padding: '10px', 
                            background: isRoomPrivate ? 'rgba(99, 102, 241, 0.08)' : 'rgba(0,0,0,0.2)', 
                            border: isRoomPrivate ? '1px solid var(--color-spades)' : '1px solid rgba(255,255,255,0.05)',
                            borderRadius: '6px',
                            cursor: 'pointer'
                          }}
                        >
                          <input 
                            type="radio" 
                            name="roomType" 
                            checked={isRoomPrivate} 
                            onChange={() => setIsRoomPrivate(true)} 
                          />
                          <span style={{ fontWeight: '700', fontSize: '0.85rem' }}>{t.privateRoom}</span>
                        </label>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                      <button 
                        className="btn-premium btn-clubs" 
                        style={{ flex: 1, justifyContent: 'center' }}
                        onClick={() => {
                          socket?.emit('create_room', { mode: 'online', isPrivate: isRoomPrivate });
                        }}
                      >
                        {t.createBtn}
                      </button>
                      <button 
                        className="btn-premium" 
                        style={{ flex: 1, justifyContent: 'center' }}
                        onClick={() => {
                          setLobbyView('menu');
                          socket?.emit('join_lobby');
                        }}
                      >
                        {t.back}
                      </button>
                    </div>
                  </div>
                ) : lobbyView === 'join' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
                    <h4 style={{ color: 'var(--text-bright)', fontSize: '1rem', textAlign: 'left' }}>{t.joinPrivateTitle}</h4>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', textAlign: 'left' }}>
                      <label style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>{t.lobbyCodeLabel}</label>
                      <input 
                        type="text" 
                        maxLength={4}
                        placeholder="e.g. 1234"
                        value={lobbyCodeInput} 
                        onChange={(e) => setLobbyCodeInput(e.target.value.replace(/\D/g, ''))}
                        className="lobby-input"
                        style={{
                          background: 'rgba(0, 0, 0, 0.3)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '6px',
                          padding: '8px 12px',
                          color: 'var(--text-bright)',
                          fontSize: '1.5rem',
                          letterSpacing: '6px',
                          textAlign: 'center',
                          fontWeight: '700'
                        }}
                      />
                    </div>

                    <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                      <button 
                        className="btn-premium btn-diamonds" 
                        style={{ flex: 1, justifyContent: 'center' }}
                        disabled={lobbyCodeInput.length !== 4}
                        onClick={() => {
                          socket?.emit('join_room', { code: lobbyCodeInput });
                        }}
                      >
                        {t.joinBtn}
                      </button>
                      <button 
                        className="btn-premium" 
                        style={{ flex: 1, justifyContent: 'center' }}
                        onClick={() => {
                          setLobbyView('menu');
                          socket?.emit('join_lobby');
                        }}
                      >
                        {t.back}
                      </button>
                    </div>
                  </div>
                ) : null}
              </>
            ) : onlineStatus === 'connecting' ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div className="spinner" style={{ margin: '0 auto 16px auto', border: '3px solid rgba(255,255,255,0.1)', borderTop: '3px solid var(--color-diamonds)', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite' }} />
                <p style={{ color: 'var(--text-bright)' }}>{t.connecting}</p>
              </div>
            ) : onlineStatus === 'waiting' ? (
              <div style={{ textAlign: 'center', padding: '10px 0', width: '100%' }}>
                <h3 style={{ color: 'var(--color-clubs)', marginBottom: '8px' }}>{t.lobbyCreated}</h3>
                
                {isRoomPrivate ? (
                  <>
                    <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', marginBottom: '16px' }}>{t.shareCode}</p>
                    <div style={{ fontSize: '3rem', fontWeight: '800', letterSpacing: '6px', color: 'var(--text-bright)', background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.1)', margin: '16px 0', textShadow: '0 0 20px rgba(255,255,255,0.1)' }}>
                      {roomCode}
                    </div>
                  </>
                ) : (
                  <div style={{ padding: '20px 12px', background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '8px', margin: '20px 0' }}>
                    <p style={{ color: 'var(--text-bright)', fontWeight: '600', fontSize: '0.9rem' }}>{t.waitingPublicDesc}</p>
                    <p style={{ color: 'var(--text-dim)', fontSize: '0.75rem', marginTop: '8px' }}>Room Code: #{roomCode}</p>
                  </div>
                )}
                
                <p style={{ color: 'var(--color-diamonds)', fontSize: '0.95rem', animation: 'pulse 1.5s infinite', margin: '20px 0' }}>
                  {t.waitingForOpponentConnect}
                </p>
                <button className="btn-premium" style={{ width: '100%', justifyContent: 'center' }} onClick={handleCancelWaiting}>
                  {t.back}
                </button>
              </div>
            ) : onlineStatus === 'error' ? (
              <div style={{ textAlign: 'center', padding: '10px 0' }}>
                <h3 style={{ color: 'var(--color-hearts)', marginBottom: '12px' }}>{t.serverError}</h3>
                <p style={{ color: 'var(--text-dim)', fontSize: '0.95rem', marginBottom: '24px' }}>{t.connectFailed}</p>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button className="btn-premium btn-diamonds" style={{ flex: 1, justifyContent: 'center' }} onClick={() => connectToLobby(serverUrl)}>
                    Retry
                  </button>
                  <button className="btn-premium" style={{ flex: 1, justifyContent: 'center' }} onClick={handleResetToMenu}>
                    {t.back}
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="mode-choices">
            <div className="glass-panel mode-card" onClick={() => handleStartGame('hotseat')}>
              <h3>{t.hotseatMode}</h3>
              <p>{t.hotseatDesc}</p>
            </div>
            <div className="glass-panel mode-card" onClick={() => setShowAiFirstChoice(true)}>
              <h3>{t.aiMode}</h3>
              <p>{t.aiDesc}</p>
            </div>
            <div className="glass-panel mode-card" onClick={() => connectToLobby(serverUrl)}>
              <h3>{t.onlineMode}</h3>
              <p>{t.onlineDesc}</p>
            </div>
          </div>
        )}
        
        <div style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>
          {t.version}
        </div>
      </div>
    );
  }

  // 2. Draft normal scene
  if (gameState.phase === 'DRAFT_NORMAL') {
    return (
      <div className="app-container">
        <DraftPhase 
          gameState={stateForRender} 
          onSelectSubsection={handleSelectSubsection} 
          language={language}
        />
      </div>
    );
  }

  // 3. Draft elite scene
  if (gameState.phase === 'DRAFT_ELITE' || gameState.phase === 'DRAFT_ELITE_SELECT') {
    return (
      <div className="app-container">
        <EliteDraftPhase 
          gameState={stateForRender} 
          onDraftElite={handleDraftElite}
          onSelectFinalElites={handleSelectFinalElites}
          language={language}
        />
      </div>
    );
  }

  // 4. Game Over screen
  if (gameState.phase === 'GAME_OVER' || gameState.winner) {
    const winnerName = gameState.winner === 'A' ? (gameState.mode === 'online' ? (TRANSLATIONS[language].onlineP1Name || 'Player 1 (A)') : 'Player A') : (gameState.mode === 'ai' ? 'Computer (AI)' : (gameState.mode === 'online' ? (TRANSLATIONS[language].onlineP2Name || 'Player 2 (B)') : 'Player B'));
    return (
      <div className="welcome-screen" style={{ gap: '20px' }}>
        <h1 className="welcome-logo" style={{ animation: 'none', filter: 'drop-shadow(0 0 40px var(--color-clubs))' }}>
          {TRANSLATIONS[language].victory || 'VICTORY!'}
        </h1>
        <h2 style={{ fontSize: '2.5rem', fontWeight: '800' }}>
          {winnerName} {TRANSLATIONS[language].isVictorious || 'is Victorious!'}
        </h2>
        <p style={{ color: 'var(--text-dim)', fontSize: '1.1rem', maxWidth: '600px', textAlign: 'center' }}>
          {TRANSLATIONS[language].gameOverDesc || 'The battle has ended. One player stands strong in the snow, the other has fallen into fatigue and ashes!'}
        </p>

        <div style={{ width: '100%', maxWidth: '600px', height: '200px', overflow: 'hidden', borderRadius: '12px', display: 'flex', border: '1px solid rgba(255,255,255,0.08)' }}>
          <GameLogs logs={gameState.logs} language={language} />
        </div>

        <div style={{ display: 'flex', gap: '16px', marginTop: '20px' }}>
          {gameState.mode === 'online' && onlineRole === 'B' ? (
            <div style={{ color: 'var(--text-dim)', alignSelf: 'center' }}>
              Waiting for Player 1 (A) to restart...
            </div>
          ) : (
            <button className="btn-premium btn-clubs" onClick={handlePlayAgain}>
              {TRANSLATIONS[language].playAgain || 'Play Again'}
            </button>
          )}
          <button className="btn-premium" onClick={handleResetToMenu}>
            {TRANSLATIONS[language].backToMenu || 'Back to Menu'}
          </button>
        </div>
      </div>
    );
  }

  // 5. Gameplay phase hider screen
  if (isTurnHandoffActive) {
    const activePlayerName = gameState.activePlayer === 'A' ? 'Player A' : 'Player B';
    return (
      <TurnOverlay 
        activePlayerName={activePlayerName}
        onConfirmReady={handleConfirmReady}
        language={language}
      />
    );
  }

  // 6. Active Gameplay scene
  return (
    <div className="app-container gameplay-layout">
      <GameBoard 
        gameState={stateForRender}
        onPlayNormal={handlePlayNormal}
        onPlayElite={handlePlayElite}
        onPlayUnderlay={handlePlayUnderlay}
        onCombat={handleCombat}
        onAttackPlayer={handleAttackPlayer}
        onEndTurn={handleEndTurn}
        onlineRole={onlineRole}
        language={language}
      />
    </div>
  );
}
