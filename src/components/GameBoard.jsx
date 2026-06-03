import React, { useState } from 'react';
import Card from './Card';
import { SUIT_LABELS } from '../game/deckBuilder';

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
        { title: 'Power 1 (Tank)', desc: 'Place card in the front lane. Enemy must attack Tanks first.' },
        { title: 'Power 2 (Stun)', desc: 'Stun an enemy card. It cannot attack on their next turn.' }
      ];
      case 'clubs': return [
        { title: 'Power 1 (Detonate)', desc: 'Deals damage equal to card value to all enemy board cards. Self-destructs.' },
        { title: 'Power 2 (Resurrect Less)', desc: 'Resurrect strongest defeated Clubs card with strictly less ATK.' }
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
    if (rank === 'J') return 11;
    if (rank === 'Q') return 12;
    if (rank === 'K') return 13;
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
        } else if (suit === 'spades') {
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
    } else if (suit === 'spades' && powerIdx === 1) {
      // Stun needs target
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
      setSelectedEliteForUnderlay(card);
      setIsUnderlayTargeting(false);
      setIsUnderlayPowerModalOpen(true);
      return;
    }

    // Case 5: Attacker selection for combat
    if (!targetingMode && playerOwner === activePlayer) {
      // Check if card can attack
      const maxAttacks = card.isElite && card.suit === 'diamonds' ? 
        (card.rank === 'J' ? 2 : card.rank === 'Q' ? 3 : 4) : 1;
      
      if (card.stunnedTurns === 0 && card.attackedThisTurn < maxAttacks) {
        setAttackerCard(card);
        setTargetingMode('ATTACK');
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
    if (targetingMode === 'ATTACK' && oppPState.board.length === 0) {
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

    const isOpp = playerOwner === oppPlayer;

    const renderCardInstance = (card) => {
      let isTargetable = false;
      if (targetingMode === 'STUN' && isOpp) isTargetable = true;
      if (targetingMode === 'HEAL' && !isOpp) isTargetable = true;
      if (targetingMode === 'MIND_CONTROL' && isOpp) {
        const limit = limitForRank(selectedHandCard.rank);
        if (card.atk <= limit) isTargetable = true;
      }
      if (isUnderlayTargeting && !isOpp && card.isElite) isTargetable = true;
      if (targetingMode === 'ATTACK' && isOpp) {
        const tanks = oppPState.board.filter(c => c.isTank);
        if (tanks.length > 0) {
          isTargetable = card.isTank; // Must attack tank
        } else {
          isTargetable = true;
        }
      }

      return (
        <Card 
          key={card.id} 
          card={card} 
          onClick={() => handleBoardCardClick(card, playerOwner)}
          isTargetable={isTargetable}
        />
      );
    };

    // Return lanes in order: for opponent, tanks are at the bottom (facing center).
    // For friendly player, tanks are at the top (facing center).
    return (
      <div style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: '8px' }}>
        {isOpp ? (
          <>
            {/* Back Row */}
            <div className="board-lane">{normalLane.map(renderCardInstance)}</div>
            {/* Front Row (Tanks) */}
            <div className="board-lane tanks">{tankLane.map(renderCardInstance)}</div>
          </>
        ) : (
          <>
            {/* Front Row (Tanks) */}
            <div className="board-lane tanks">{tankLane.map(renderCardInstance)}</div>
            {/* Back Row */}
            <div className="board-lane">{normalLane.map(renderCardInstance)}</div>
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
            {targetingMode === 'STUN' && "Select an enemy card to Stun!"}
            {targetingMode === 'MIND_CONTROL' && "Select an enemy card with low enough ATK to Mind Control!"}
            {targetingMode === 'ATTACK' && "Select an enemy card or click enemy LP (if no board cards) to Attack!"}
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
        {/* Opponent Info Header */}
        <div className="player-banner" style={{ borderBottomColor: activePlayer === oppPlayer ? 'var(--color-hearts)' : 'var(--border-light)' }}>
          <div className="player-info-left">
            <span className="player-name" style={{ color: activePlayer === oppPlayer ? 'var(--color-hearts)' : 'inherit' }}>
              {oppPState.name} {activePlayer === oppPlayer && '•'}
            </span>
            <div className="hp-bar-container">
              <div className="hp-bar-fill" style={{ width: `${(oppPState.lp / 150) * 100}%` }} />
            </div>
            {oppPState.has10CardBuff && <span className="active-buff-badge">10-CARD HAND BUFF</span>}
          </div>
          <div 
            className="lp-counter"
            onClick={oppPState.board.length === 0 ? handleOpponentLpAttackClick : undefined}
            style={{
              cursor: (targetingMode === 'ATTACK' && oppPState.board.length === 0) ? 'pointer' : 'default',
              animation: (targetingMode === 'ATTACK' && oppPState.board.length === 0) ? 'pulse-alert 1s infinite alternate' : 'none',
              padding: '2px 8px',
              borderRadius: '6px',
              border: (targetingMode === 'ATTACK' && oppPState.board.length === 0) ? '2px solid var(--color-hearts)' : 'none'
            }}
          >
            LP: {oppPState.lp}
          </div>
        </div>

        {/* Opponent Hand (Back face) */}
        <div className="hand-container" style={{ transform: 'rotate(0)' }}>
          {oppPState.hand.map((card, i) => (
            <Card key={card.id || i} card={card} showBack={true} />
          ))}
        </div>

        {/* Battlefield middle card grid lanes */}
        <div className="board-zone">
          {/* Opponent board */}
          {renderBoardLane(oppPState.board, oppPlayer)}
          
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

          {/* Friendly board */}
          {renderBoardLane(pA.board, 'A')}
        </div>

        {/* Friendly Hand */}
        <div className="hand-container">
          {pA.hand.map((card) => {
            const isPlayable = activePlayer === 'A' && !isAiTurn && !winner;
            return (
              <Card 
                key={card.id} 
                card={card} 
                onClick={() => handleHandCardClick(card)}
                isPlayable={isPlayable}
              />
            );
          })}
        </div>

        {/* Player Info Footer */}
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
          <div 
            className="lp-counter"
            onClick={handleLpHealClick}
            style={{
              cursor: targetingMode === 'HEAL' ? 'pointer' : 'default',
              animation: targetingMode === 'HEAL' ? 'pulse-alert 1s infinite alternate' : 'none',
              padding: '2px 8px',
              borderRadius: '6px',
              border: targetingMode === 'HEAL' ? '2px solid var(--color-clubs)' : 'none'
            }}
          >
            LP: {pA.lp}
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
