import React, { useState } from 'react';
import Card from './Card';
import { SUIT_LABELS } from '../game/deckBuilder';
import { getPlayLimit, canCardAttack } from '../game/gameEngine';

export default function GameBoard({ 
  gameState, 
  onPlayNormal, 
  onPlayElite, 
  onPlayUnderlay,
  onCombat, 
  onAttackPlayer, 
  onEndTurn 
}) {
  const { players, activePlayer, turnCount, winner } = gameState;
  const pA = players.A;
  const pB = players.B;
  const hasTankA = pA.board.some(c => c.isTank);
  const hasTankB = pB.board.some(c => c.isTank);

  // Local UI state for targeting and choices
  const [selectedHandCard, setSelectedHandCard] = useState(null); // Card selected from hand
  const [selectedPowerIdx, setSelectedPowerIdx] = useState(null); // Selected power index (for normal cards)
  const [isPowerModalOpen, setIsPowerModalOpen] = useState(false); // Normal card power modal
  const [isEliteModalOpen, setIsEliteModalOpen] = useState(false); // Elite card choice modal
  
  // Underlay specific UI state
  const [isUnderlayTargeting, setIsUnderlayTargeting] = useState(false);
  const [pendingUnderlayAce, setPendingUnderlayAce] = useState(null);
  const [selectedEliteForUnderlay, setSelectedEliteForUnderlay] = useState(null);
  const [isUnderlayPowerModalOpen, setIsUnderlayPowerModalOpen] = useState(false);

  // General targeting state
  const [targetingMode, setTargetingMode] = useState(null); // 'HEAL' | 'STUN' | 'MIND_CONTROL' | 'ATTACK'
  const [attackerCard, setAttackerCard] = useState(null); // Attacker card for combat targeting

  const activePState = players[activePlayer];
  const oppPlayer = activePlayer === 'A' ? 'B' : 'A';
  const oppPState = players[oppPlayer];

  // Helper to check if it's player B's turn and B is AI
  const isAiTurn = gameState.mode === 'ai' && activePlayer === 'B';

  // Helper to describe normal powers
  const getNormalPowerLabels = (suit) => {
    switch (suit) {
      case 'diamonds': return [
        { title: 'Power 1 (Draw)', desc: 'Draw 1 card from your deck immediately.' },
        { title: 'Power 2 (Strike)', desc: 'Card gains Haste/Charge and can attack this turn.' }
      ];
      case 'hearts': return [
        { title: 'Power 1 (Heal)', desc: 'Heal a friendly card or player LP. Overheal deals damage to opponent.' },
        { title: 'Power 2 (Damage)', desc: 'Deal direct damage equal to card value to opponent LP.' }
      ];
      case 'spades': return [
        { title: 'Power 1 (Tank)', desc: 'Place card in front lane to protect other friendly board cards.' },
        { title: 'Power 2 (Stun)', desc: 'Stun one enemy board card for 1 turn.' }
      ];
      case 'clubs': return [
        { title: 'Power 1 (Scythe Sweep)', desc: 'Deal damage equal to card value to all enemy board cards. Card is defeated.' },
        { title: 'Power 2 (Shield Strike)', desc: 'Deal damage equal to card value to one enemy board card. Card stays on board.' }
      ];
      default: return [];
    }
  };

  // Helper to describe Elite abilities
  const getEliteAbilities = (suit, rank) => {
    if (suit === 'diamonds') {
      if (rank === 'J') return [
        'Attack twice and gain Strike',
        'Draw 2 cards',
        'Attack once and draw 1 card'
      ];
      if (rank === 'Q') return [
        'Attack 3 times and gain Strike',
        'Attack twice and draw 1 card',
        'Attack once and draw 2 cards',
        'Draw 3 cards'
      ];
      if (rank === 'K') return [
        'Attack 4 times and gain Strike',
        'Attack 3 times and draw 1 card',
        'Attack twice and draw 2 cards',
        'Attack once and draw 3 cards',
        'Draw 4 cards'
      ];
      if (rank === 'A') return [
        'Underlay: Attach under a board Elite to grant it Diamonds powers',
        'Symmetrical Draw: Both players draw 5 cards'
      ];
    }
    if (suit === 'hearts') {
      if (rank === 'A') return [
        'Underlay: Attach under a board Elite to grant it Hearts powers',
        'Symmetrical Heal: Both players restore 50 LP'
      ];
      const val = rank === 'J' ? 12 : rank === 'Q' ? 13 : 14;
      return [
        `Mind Control: Take control of enemy card with ATK <= ${limitForRank(rank)}`,
        `Symmetrical Surge: Heal friendly characters by ${val} AND deal ${val} damage to enemy LP`
      ];
    }
    if (suit === 'spades') {
      if (rank === 'A') return [
        'Underlay: Attach under a board Elite to grant it Spades powers',
        'Global Stun: Stun all board cards (both players) for 4 turns'
      ];
      const turns = rank === 'J' ? 1 : rank === 'Q' ? 2 : 3;
      return [
        `Become Tank and stun all enemy board cards for ${turns} turn(s)`,
        `Gain Protective Shield (only broken by single hit > ${limitForRank(rank)})`
      ];
    }
    if (suit === 'clubs') {
      if (rank === 'A') return [
        'Underlay: Attach under a board Elite to grant it Clubs powers',
        'Board Wipe: Defeat all cards on board for both players'
      ];
      const dmg = rank === 'J' ? 12 : rank === 'Q' ? 13 : 14;
      const count = rank === 'J' ? 2 : rank === 'Q' ? 3 : 4;
      return [
        `Detonation: Deal ${dmg} damage to all enemy board cards`,
        `Summon: Resurrect ${count} defeated normal Clubs cards (< ${dmg} ATK)`
      ];
    }
    return [];
  };

  const limitForRank = (rank) => {
    if (rank === 'J') return 12;
    if (rank === 'Q') return 13;
    if (rank === 'K') return 14;
    return 14;
  };

  // 1. Hand card selection
  const handleHandCardClick = (card) => {
    if (isAiTurn || winner) return;
    
    // Safety check: is it player's own hand card
    const hand = activePState.hand;
    if (!hand.some(c => c.id === card.id)) return;

    setSelectedHandCard(card);
    
    if (card.isElite) {
      setIsEliteModalOpen(true);
    } else {
      // Normal card: open power index choice modal (unless 10-card hand buff is active)
      if (activePState.has10CardBuff) {
        // Dual activation: both powers trigger, but check if we need to stun/heal
        const suit = card.suit;
        if (suit === 'hearts') {
          // Heal needs target
          setTargetingMode('HEAL');
          setSelectedPowerIdx(0); // arbitrary but registers as play
        } else if (suit === 'spades' && oppPState.board.length > 0) {
          // Stun needs target
          setTargetingMode('STUN');
          setSelectedPowerIdx(0);
        } else {
          // No targeting needed, play immediately
          onPlayNormal(card.id, 0);
          resetStates();
        }
      } else {
        setIsPowerModalOpen(true);
      }
    }
  };

  // 2. Select normal power
  const handleSelectNormalPower = (powerIdx) => {
    setIsPowerModalOpen(false);
    setSelectedPowerIdx(powerIdx);

    const suit = selectedHandCard.suit;
    if (suit === 'hearts' && powerIdx === 0) {
      // Heal needs target
      setTargetingMode('HEAL');
    } else if ((suit === 'spades' || suit === 'clubs') && powerIdx === 1 && oppPState.board.length > 0) {
      // Stun / Shield Strike needs target
      setTargetingMode('STUN');
    } else {
      // Plays immediately
      onPlayNormal(selectedHandCard.id, powerIdx);
      resetStates();
    }
  };

  // 3. Select Elite ability
  const handleSelectEliteAbility = (abilityIdx) => {
    setIsEliteModalOpen(false);

    const suit = selectedHandCard.suit;
    const rank = selectedHandCard.rank;

    // Ace underlays
    if (rank === 'A' && abilityIdx === 0) {
      // Ace underlay: select target friendly Elite on board
      setPendingUnderlayAce(selectedHandCard);
      setIsUnderlayTargeting(true);
      return;
    }

    // Heart mind control (index 0 for J, Q, K)
    if (suit === 'hearts' && rank !== 'A' && abilityIdx === 0) {
      setTargetingMode('MIND_CONTROL');
      return;
    }

    // Direct elite play with no targeting
    onPlayElite(selectedHandCard.id, abilityIdx);
    resetStates();
  };

  // 4. Click a board card (could be attacker, combat defender, stun target, heal target, or underlay target)
  const handleBoardCardClick = (card, playerOwner) => {
    if (isAiTurn || winner) return;

    // Case 1: Stun targeting
    if (targetingMode === 'STUN' && playerOwner === oppPlayer) {
      onPlayNormal(selectedHandCard.id, selectedPowerIdx, card.id);
      resetStates();
      return;
    }

    // Case 2: Heal targeting
    if (targetingMode === 'HEAL' && playerOwner === activePlayer) {
      if (selectedHandCard) {
        onPlayNormal(selectedHandCard.id, selectedPowerIdx, card.id);
      }
      resetStates();
      return;
    }

    // Case 3: Mind control targeting
    if (targetingMode === 'MIND_CONTROL' && playerOwner === oppPlayer) {
      // Verify limit
      const limit = limitForRank(selectedHandCard.rank);
      if (card.atk <= limit) {
        onPlayElite(selectedHandCard.id, 0, { targetId: card.id });
        resetStates();
      }
      return;
    }

    // Case 4: Underlay Ace targeting
    if (isUnderlayTargeting && playerOwner === activePlayer && card.isElite) {
      if (pendingUnderlayAce && pendingUnderlayAce.suit === card.suit) {
        // Block same suit underlay
        return;
      }
      setSelectedEliteForUnderlay(card);
      setIsUnderlayTargeting(false);
      setIsUnderlayPowerModalOpen(true);
      return;
    }

    // Case 5: Attacker selection for combat
    if (!targetingMode && playerOwner === activePlayer) {
      if (canCardAttack(card)) {
        if (oppPState.board.length === 0) {
          // Attack player directly automatically!
          onAttackPlayer(card.id);
          resetStates();
        } else {
          setAttackerCard(card);
          setTargetingMode('ATTACK');
        }
      }
      return;
    }

    // Case 6: Attacking defender target selection
    if (targetingMode === 'ATTACK' && playerOwner === oppPlayer) {
      // Check Spades Tank attacking rule
      const tanks = oppPState.board.filter(c => c.isTank);
      if (tanks.length > 0 && !card.isTank) {
        // Must attack tank
        return;
      }
      onCombat(attackerCard.id, card.id);
      resetStates();
      return;
    }
  };

  // Resolve underlay Ace power option
  const handleSelectUnderlayPower = (abilityIdx) => {
    setIsUnderlayPowerModalOpen(false);
    onPlayUnderlay(pendingUnderlayAce.id, selectedEliteForUnderlay.id, abilityIdx);
    resetStates();
  };

  const handleLpHealClick = () => {
    if (targetingMode === 'HEAL') {
      onPlayNormal(selectedHandCard.id, selectedPowerIdx, 'player');
      resetStates();
    }
  };

  const handleOpponentLpAttackClick = () => {
    const hasTank = oppPState.board.some(c => c.isTank);
    if (targetingMode === 'ATTACK' && !hasTank) {
      onAttackPlayer(attackerCard.id);
      resetStates();
    }
  };

  const resetStates = () => {
    setSelectedHandCard(null);
    setSelectedPowerIdx(null);
    setIsPowerModalOpen(false);
    setIsEliteModalOpen(false);
    setTargetingMode(null);
    setAttackerCard(null);
    setIsUnderlayTargeting(false);
    setPendingUnderlayAce(null);
    setSelectedEliteForUnderlay(null);
    setIsUnderlayPowerModalOpen(false);
  };

  // Cancel action
  const handleCancelAction = () => {
    resetStates();
  };

  // Render lanes: Tanks (front) and normal fighters (back)
  const renderBoardLane = (boardCards, playerOwner) => {
    const normalLane = boardCards.filter(c => !c.isTank);
    const tankLane = boardCards.filter(c => c.isTank);

    const isTopPlayer = playerOwner === 'B';

    const renderCardInstance = (card) => {
      const isOpponentOfActive = playerOwner !== activePlayer;
      let isTargetable = false;
      if (targetingMode === 'STUN' && isOpponentOfActive) isTargetable = true;
      if (targetingMode === 'HEAL' && !isOpponentOfActive) isTargetable = true;
      if (targetingMode === 'MIND_CONTROL' && isOpponentOfActive) {
        const limit = limitForRank(selectedHandCard.rank);
        if (card.atk <= limit) isTargetable = true;
      }
      if (isUnderlayTargeting && !isOpponentOfActive && card.isElite) {
        if (pendingUnderlayAce && pendingUnderlayAce.suit !== card.suit) {
          isTargetable = true;
        }
      }
      if (targetingMode === 'ATTACK' && isOpponentOfActive) {
        const tanks = oppPState.board.filter(c => c.isTank);
        if (tanks.length > 0) {
          isTargetable = card.isTank; // Must attack tank
        } else {
          isTargetable = true;
        }
      }

      const isAttackReady = activePlayer === playerOwner && !isAiTurn && !winner && !targetingMode && !isUnderlayTargeting && canCardAttack(card);

      return (
        <Card 
          key={card.id} 
          card={card} 
          onClick={() => handleBoardCardClick(card, playerOwner)}
          isTargetable={isTargetable}
          isAttackReady={isAttackReady}
        />
      );
    };

    // Return lanes in order: for opponent (Player B/top), tanks are at the bottom (facing center).
    // For friendly player (Player A/bottom), tanks are at the top (facing center).
    const showNormal = normalLane.length > 0 || tankLane.length === 0;
    const showTank = tankLane.length > 0;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: '8px' }}>
        {isTopPlayer ? (
          <>
            {/* Back Row */}
            {showNormal && <div className="board-lane">{normalLane.map(renderCardInstance)}</div>}
            {/* Front Row (Tanks) */}
            {showTank && <div className="board-lane tanks">{tankLane.map(renderCardInstance)}</div>}
          </>
        ) : (
          <>
            {/* Front Row (Tanks) */}
            {showTank && <div className="board-lane tanks">{tankLane.map(renderCardInstance)}</div>}
            {/* Back Row */}
            {showNormal && <div className="board-lane">{normalLane.map(renderCardInstance)}</div>}
          </>
        )}
      </div>
    );
  };

  return (
    <div className="gameplay-arena">
      {/* Targeting Indicator Banner */}
      {targetingMode && (
        <div className="targeting-indicator-banner">
          <span>
            {targetingMode === 'HEAL' && "Select a friendly card or click your LP bar to Heal!"}
            {targetingMode === 'STUN' && (selectedHandCard?.suit === 'clubs' ? "Select an enemy card to Shield Strike!" : "Select an enemy card to Stun!")}
            {targetingMode === 'MIND_CONTROL' && "Select an enemy card with low enough ATK to Mind Control!"}
            {targetingMode === 'ATTACK' && "Select an enemy card or click enemy LP (if no enemy Spades Tanks) to Attack!"}
          </span>
          <button 
            onClick={handleCancelAction}
            style={{
              background: 'rgba(0,0,0,0.5)',
              border: '1px solid #fff',
              color: '#fff',
              padding: '2px 8px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.8rem'
            }}
          >
            Cancel
          </button>
        </div>
      )}

      {isUnderlayTargeting && (
        <div className="targeting-indicator-banner" style={{ background: 'var(--color-spades)' }}>
          <span>Select a friendly Elite card on your board to underlay the Ace!</span>
          <button 
            onClick={handleCancelAction}
            style={{
              background: 'rgba(0,0,0,0.5)',
              border: '1px solid #fff',
              color: '#fff',
              padding: '2px 8px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.8rem'
            }}
          >
            Cancel
          </button>
        </div>
      )}

      <div className="battlefield">
        {/* Opponent (Player B) Info Header */}
        <div className="player-banner" style={{ borderBottomColor: activePlayer === 'B' ? 'var(--color-hearts)' : 'var(--border-light)' }}>
          <div className="player-info-left">
            <span className="player-name" style={{ color: activePlayer === 'B' ? 'var(--color-hearts)' : 'inherit' }}>
              {pB.name} {activePlayer === 'B' && '•'}
            </span>
            <div className="hp-bar-container">
              <div className="hp-bar-fill" style={{ width: `${(pB.lp / 150) * 100}%` }} />
            </div>
            {pB.has10CardBuff && <span className="active-buff-badge">10-CARD HAND BUFF</span>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="play-limit-indicator" style={{ 
              fontSize: '0.85rem', 
              color: 'var(--text-dim)', 
              background: 'rgba(255,255,255,0.05)',
              padding: '2px 8px',
              borderRadius: '4px',
              border: '1px solid rgba(255,255,255,0.1)'
            }}>
              Plays: {pB.cardsPlayedThisTurn}/{getPlayLimit(pB.lp, pB.has10CardBuff)}
            </div>
            <div 
              className="lp-counter"
              onClick={activePlayer === 'B' && targetingMode === 'HEAL' ? handleLpHealClick : (activePlayer === 'A' && targetingMode === 'ATTACK' && !hasTankB ? handleOpponentLpAttackClick : undefined)}
              style={{
                cursor: (activePlayer === 'B' && targetingMode === 'HEAL') || (activePlayer === 'A' && targetingMode === 'ATTACK' && !hasTankB) ? 'pointer' : 'default',
                animation: (activePlayer === 'B' && targetingMode === 'HEAL') || (activePlayer === 'A' && targetingMode === 'ATTACK' && !hasTankB) ? 'pulse-alert 1s infinite alternate' : 'none',
                padding: '2px 8px',
                borderRadius: '6px',
                border: (activePlayer === 'B' && targetingMode === 'HEAL') ? '2px solid var(--color-clubs)' : (activePlayer === 'A' && targetingMode === 'ATTACK' && !hasTankB ? '2px solid var(--color-hearts)' : 'none')
              }}
            >
              ❤️{pB.lp} LP
            </div>
          </div>
        </div>

        {/* Player B Hand */}
        <div className="hand-container" style={{ transform: 'rotate(0)' }}>
          {pB.hand.map((card, i) => {
            const showBack = gameState.mode === 'ai' ? true : (activePlayer !== 'B');
            const isPlayable = activePlayer === 'B' && gameState.mode !== 'ai' && !winner && pB.cardsPlayedThisTurn < getPlayLimit(pB.lp, pB.has10CardBuff);
            return (
              <Card 
                key={card.id || i} 
                card={card} 
                showBack={showBack} 
                onClick={isPlayable ? () => handleHandCardClick(card) : undefined}
                isPlayable={isPlayable}
              />
            );
          })}
        </div>

        {/* Battlefield middle card grid lanes */}
        <div className="board-zone">
          {/* Opponent board (Player B) */}
          {renderBoardLane(pB.board, 'B')}
          
          {/* Controls line */}
          <div className="game-controls-divider">
            <div style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>
              Turn {turnCount}
            </div>
            <button 
              className="btn-premium"
              disabled={isAiTurn || !!winner}
              onClick={onEndTurn}
            >
              End Turn
            </button>
          </div>

          {/* Friendly board (Player A) */}
          {renderBoardLane(pA.board, 'A')}
        </div>

        {/* Friendly Hand (Player A) */}
        <div className="hand-container">
          {pA.hand.map((card, i) => {
            const showBack = gameState.mode === 'ai' ? false : (activePlayer !== 'A');
            const isPlayable = activePlayer === 'A' && !winner && pA.cardsPlayedThisTurn < getPlayLimit(pA.lp, pA.has10CardBuff);
            return (
              <Card 
                key={card.id || i} 
                card={card} 
                showBack={showBack}
                onClick={isPlayable ? () => handleHandCardClick(card) : undefined}
                isPlayable={isPlayable}
              />
            );
          })}
        </div>

        {/* Friendly (Player A) Info Footer */}
        <div className="player-banner" style={{ borderTopColor: activePlayer === 'A' ? 'var(--color-spades)' : 'var(--border-light)' }}>
          <div className="player-info-left">
            <span className="player-name" style={{ color: activePlayer === 'A' ? 'var(--color-spades)' : 'inherit' }}>
              {pA.name} {activePlayer === 'A' && '•'}
            </span>
            <div className="hp-bar-container">
              <div className="hp-bar-fill" style={{ width: `${(pA.lp / 150) * 100}%` }} />
            </div>
            {pA.has10CardBuff && <span className="active-buff-badge">10-CARD HAND BUFF</span>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="play-limit-indicator" style={{ 
              fontSize: '0.85rem', 
              color: 'var(--text-dim)', 
              background: 'rgba(255,255,255,0.05)',
              padding: '2px 8px',
              borderRadius: '4px',
              border: '1px solid rgba(255,255,255,0.1)'
            }}>
              Plays: {pA.cardsPlayedThisTurn}/{getPlayLimit(pA.lp, pA.has10CardBuff)}
            </div>
            <div 
              className="lp-counter"
              onClick={activePlayer === 'A' && targetingMode === 'HEAL' ? handleLpHealClick : (activePlayer === 'B' && targetingMode === 'ATTACK' && !hasTankA ? handleOpponentLpAttackClick : undefined)}
              style={{
                cursor: (activePlayer === 'A' && targetingMode === 'HEAL') || (activePlayer === 'B' && targetingMode === 'ATTACK' && !hasTankA) ? 'pointer' : 'default',
                animation: (activePlayer === 'A' && targetingMode === 'HEAL') || (activePlayer === 'B' && targetingMode === 'ATTACK' && !hasTankA) ? 'pulse-alert 1s infinite alternate' : 'none',
                padding: '2px 8px',
                borderRadius: '6px',
                border: (activePlayer === 'A' && targetingMode === 'HEAL') ? '2px solid var(--color-clubs)' : (activePlayer === 'B' && targetingMode === 'ATTACK' && !hasTankA ? '2px solid var(--color-hearts)' : 'none')
              }}
            >
              ❤️{pA.lp} LP
            </div>
          </div>
        </div>
      </div>

      {/* Side status panels (Decks & Defeated) */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div className="deck-pile-indicators">
          <div className="deck-status-box">
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>DECK</div>
            <div style={{ fontSize: '1.25rem', fontWeight: '800' }}>{pA.deck.length}</div>
          </div>
          <div className="deck-status-box" style={{ borderLeftColor: 'var(--color-hearts)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>DEFEATED</div>
            <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--color-hearts)' }}>{pA.defeated.length}</div>
          </div>
        </div>

        {/* Visual fatigue counter log if applicable */}
        <div style={{ 
          padding: '8px 16px', 
          fontSize: '0.75rem', 
          color: 'var(--text-dim)', 
          textAlign: 'center',
          background: 'rgba(255,255,255,0.01)',
          borderBottom: '1px solid rgba(255,255,255,0.05)'
        }}>
          Fatigue Draw count: {gameState.defeatedDrawsCount.A} (P1) / {gameState.defeatedDrawsCount.B} (P2)
        </div>
      </div>

      {/* Normal Card Power Choice Modal */}
      {isPowerModalOpen && selectedHandCard && (
        <div className="card-modal-backdrop" onClick={handleCancelAction}>
          <div className="glass-panel card-modal-content" onClick={(e) => e.stopPropagation()} style={{ borderTop: `4px solid ${SUIT_LABELS[selectedHandCard.suit].color}` }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '700' }}>Activate Card Power</h3>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span className={`card-suit-symbol ${selectedHandCard.suit}`}>{SUIT_LABELS[selectedHandCard.suit].symbol}</span>
              <span style={{ fontSize: '1.1rem', fontWeight: '600' }}>{selectedHandCard.suit.toUpperCase()} {selectedHandCard.value}</span>
            </div>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>Choose one of the suit abilities to activate when playing this card:</p>

            <div className="choice-buttons-container">
              {getNormalPowerLabels(selectedHandCard.suit).map((power, idx) => (
                <button 
                  key={idx} 
                  className="choice-row-btn"
                  onClick={() => handleSelectNormalPower(idx)}
                >
                  <div style={{ fontWeight: '700', marginBottom: '2px' }}>{power.title}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>{power.desc}</div>
                </button>
              ))}
            </div>
            <button className="btn-premium" onClick={handleCancelAction} style={{ marginTop: '10px' }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Elite Card Ability Choice Modal */}
      {isEliteModalOpen && selectedHandCard && (
        <div className="card-modal-backdrop" onClick={handleCancelAction}>
          <div className="glass-panel card-modal-content" onClick={(e) => e.stopPropagation()} style={{ borderTop: `4px solid ${SUIT_LABELS[selectedHandCard.suit].color}` }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '700' }}>Activate Elite Ability</h3>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span className={`card-suit-symbol ${selectedHandCard.suit}`}>{SUIT_LABELS[selectedHandCard.suit].symbol}</span>
              <span style={{ fontSize: '1.1rem', fontWeight: '600' }}>Elite {selectedHandCard.rank} of {selectedHandCard.suit.toUpperCase()}</span>
            </div>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>Choose one of the elite abilities to trigger:</p>

            <div className="choice-buttons-container">
              {getEliteAbilities(selectedHandCard.suit, selectedHandCard.rank).map((label, idx) => (
                <button 
                  key={idx} 
                  className="choice-row-btn"
                  onClick={() => handleSelectEliteAbility(idx)}
                >
                  {label}
                </button>
              ))}
            </div>
            <button className="btn-premium" onClick={handleCancelAction} style={{ marginTop: '10px' }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Underlay Ace Ability Choice Modal */}
      {isUnderlayPowerModalOpen && pendingUnderlayAce && selectedEliteForUnderlay && (
        <div className="card-modal-backdrop">
          <div className="glass-panel card-modal-content" style={{ borderTop: `4px solid ${SUIT_LABELS[pendingUnderlayAce.suit].color}` }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '700' }}>Choose Underlay Power</h3>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>
              You are placing the Ace of <strong style={{ color: SUIT_LABELS[pendingUnderlayAce.suit].color }}>{pendingUnderlayAce.suit.toUpperCase()}</strong> under your active Elite {selectedEliteForUnderlay.rank}. Choose which {pendingUnderlayAce.suit.toUpperCase()} power of rank {selectedEliteForUnderlay.rank} to activate:
            </p>

            <div className="choice-buttons-container">
              {getEliteAbilities(pendingUnderlayAce.suit, selectedEliteForUnderlay.rank).map((label, idx) => (
                <button 
                  key={idx} 
                  className="choice-row-btn"
                  onClick={() => handleSelectUnderlayPower(idx)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
