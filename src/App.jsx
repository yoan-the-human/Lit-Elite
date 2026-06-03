import React, { useState, useEffect } from 'react';
import './App.css';
import { getInitialGameState, draftNormalSubsection, draftEliteCard, selectFinalElites, playNormalCard, playEliteCard, playUnderlayAce, executeCombat, executeAttackPlayer, endTurn } from './game/gameEngine';
import { runAiGameplayTurn, getAiNormalDraftChoice, getAiEliteDraftChoice } from './game/aiOpponent';
import DraftPhase from './components/DraftPhase';
import EliteDraftPhase from './components/EliteDraftPhase';
import GameBoard from './components/GameBoard';
import GameLogs from './components/GameLogs';
import TurnOverlay from './components/TurnOverlay';

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

  // Start game action
  const handleStartGame = (mode, forcedStartingPlayer = null) => {
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
    setGameState(prev => {
      const next = structuredClone(prev);
      return draftNormalSubsection(next, subId);
    });
  };

  const handleDraftElite = (cardId) => {
    setGameState(prev => {
      const next = structuredClone(prev);
      return draftEliteCard(next, cardId);
    });
  };

  const handleSelectFinalElites = (player, cardIds) => {
    setGameState(prev => {
      const next = structuredClone(prev);
      return selectFinalElites(next, player, cardIds);
    });
  };

  // Gameplay actions
  const handlePlayNormal = (cardId, powerIdx, targetInfo) => {
    setGameState(prev => {
      const next = structuredClone(prev);
      return playNormalCard(next, cardId, powerIdx, targetInfo);
    });
  };

  const handlePlayElite = (cardId, abilityIdx, extraParams) => {
    setGameState(prev => {
      const next = structuredClone(prev);
      return playEliteCard(next, cardId, abilityIdx, extraParams);
    });
  };

  const handlePlayUnderlay = (aceId, targetEliteId, abilityIdx) => {
    setGameState(prev => {
      const next = structuredClone(prev);
      return playUnderlayAce(next, aceId, targetEliteId, abilityIdx);
    });
  };

  const handleCombat = (attackerId, defenderId) => {
    setGameState(prev => {
      const next = structuredClone(prev);
      return executeCombat(next, attackerId, defenderId);
    });
  };

  const handleAttackPlayer = (attackerId) => {
    setGameState(prev => {
      const next = structuredClone(prev);
      return executeAttackPlayer(next, attackerId);
    });
  };

  const handleEndTurn = () => {
    setGameState(prev => {
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
      }, 1200); // 1.2s delay for AI thinking feel
      return () => clearTimeout(timer);
    }
  }, [gameState]);

  // Handoff ready handler
  const handleConfirmReady = () => {
    setIsTurnHandoffActive(false);
  };

  // Return to menu
  const handleResetToMenu = () => {
    setGameState(null);
    setIsTurnHandoffActive(false);
  };

  // 1. Welcome scene
  if (!gameState) {
    return (
      <div className="welcome-screen">
        <h1 className="welcome-logo">MORLD</h1>
        <p className="welcome-subtitle">
          Siberian-Grade 1v1 Card Combat. Assemble your deck through Odd/Even drafting, space your Elites, and command custom card powers to crush opponent LP.
        </p>
        
        {showAiFirstChoice ? (
          <div className="glass-panel mode-card" style={{ maxWidth: '500px', width: '100%', cursor: 'default' }}>
            <h3 style={{ marginBottom: '16px', color: 'var(--text-bright)' }}>Who drafts first, comrade?</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button className="btn-premium btn-spades" style={{ justifyContent: 'center' }} onClick={() => handleStartGame('ai', 'A')}>
                I Draft First (Player A)
              </button>
              <button className="btn-premium btn-hearts" style={{ justifyContent: 'center' }} onClick={() => handleStartGame('ai', 'B')}>
                AI Drafts First (Player B)
              </button>
              <button className="btn-premium btn-diamonds" style={{ justifyContent: 'center' }} onClick={() => handleStartGame('ai', null)}>
                Coin Flip (Let Chance Decide)
              </button>
              <button className="btn-premium btn-clubs" style={{ marginTop: '8px', justifyContent: 'center' }} onClick={() => setShowAiFirstChoice(false)}>
                ← Back
              </button>
            </div>
          </div>
        ) : (
          <div className="mode-choices">
            <div className="glass-panel mode-card" onClick={() => handleStartGame('hotseat')}>
              <h3>Pass & Play (Hotseat)</h3>
              <p>1v1 battle on the same computer. Full screen blockers hide hands between turns.</p>
            </div>
            <div className="glass-panel mode-card" onClick={() => setShowAiFirstChoice(true)}>
              <h3>Vs Computer (AI)</h3>
              <p>Play against the custom automated AI player. Perfect for testing and practicing.</p>
            </div>
          </div>
        )}
        
        <div style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>
          Version 1.0.0 (Offline Mode) • Glory to the Motherland!
        </div>
      </div>
    );
  }

  // 2. Draft normal scene
  if (gameState.phase === 'DRAFT_NORMAL') {
    return (
      <div className="app-container">
        <DraftPhase 
          gameState={gameState} 
          onSelectSubsection={handleSelectSubsection} 
        />
      </div>
    );
  }

  // 3. Draft elite scene
  if (gameState.phase === 'DRAFT_ELITE' || gameState.phase === 'DRAFT_ELITE_SELECT') {
    return (
      <div className="app-container">
        <EliteDraftPhase 
          gameState={gameState} 
          onDraftElite={handleDraftElite}
          onSelectFinalElites={handleSelectFinalElites}
        />
      </div>
    );
  }

  // 4. Game Over screen
  if (gameState.phase === 'GAME_OVER' || gameState.winner) {
    const winnerName = gameState.winner === 'A' ? 'Player A' : (gameState.mode === 'ai' ? 'Computer (AI)' : 'Player B');
    return (
      <div className="welcome-screen" style={{ gap: '20px' }}>
        <h1 className="welcome-logo" style={{ animation: 'none', filter: 'drop-shadow(0 0 40px var(--color-clubs))' }}>
          VICTORY!
        </h1>
        <h2 style={{ fontSize: '2.5rem', fontWeight: '800' }}>
          {winnerName} is Victorious!
        </h2>
        <p style={{ color: 'var(--text-dim)', fontSize: '1.1rem', maxWidth: '600px', textAlign: 'center' }}>
          The battle has ended. One player stands strong in the snow, the other has fallen into fatigue and ashes!
        </p>

        <div style={{ width: '100%', maxWidth: '600px', height: '200px', overflow: 'hidden', borderRadius: '12px', display: 'flex', border: '1px solid rgba(255,255,255,0.08)' }}>
          <GameLogs logs={gameState.logs} />
        </div>

        <div style={{ display: 'flex', gap: '16px', marginTop: '20px' }}>
          <button className="btn-premium btn-clubs" onClick={() => handleStartGame(gameState.mode)}>
            Play Again
          </button>
          <button className="btn-premium" onClick={handleResetToMenu}>
            Back to Menu
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
      />
    );
  }

  // 6. Active Gameplay scene
  return (
    <div className="app-container" style={{ display: 'grid', gridTemplateColumns: '1fr 340px' }}>
      <GameBoard 
        gameState={gameState}
        onPlayNormal={handlePlayNormal}
        onPlayElite={handlePlayElite}
        onPlayUnderlay={handlePlayUnderlay}
        onCombat={handleCombat}
        onAttackPlayer={handleAttackPlayer}
        onEndTurn={handleEndTurn}
      />
      <GameLogs logs={gameState.logs} />
    </div>
  );
}
