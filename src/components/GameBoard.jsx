import React, { useState } from 'react';
import Card from './Card';
import { SUIT_LABELS } from '../game/deckBuilder';
import { getPlayLimit, canCardAttack } from '../game/gameEngine';
import { TRANSLATIONS } from '../game/translations';
import GameLogs from './GameLogs';

export default function GameBoard({ 
  gameState, 
  onPlayNormal, 
  onPlayElite, 
  onPlayUnderlay,
  onCombat, 
  onAttackPlayer, 
  onEndTurn,
  language = 'en',
  onlineRole = null
}) {
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;
  const { players, activePlayer, turnCount, winner } = gameState;
  const pA = players.A;
  const pB = players.B;
  const hasTankA = pA.board.some(c => c.isTank && !(c.stunnedTurns > 0));
  const hasTankB = pB.board.some(c => c.isTank && !(c.stunnedTurns > 0));

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

  // Search Deck UI state
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [searchAllowedRanks, setSearchAllowedRanks] = useState([]);
  const [searchConfirmCallback, setSearchConfirmCallback] = useState(null);

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
    const isBg = language === 'bg';
    switch (suit) {
      case 'diamonds': return [
        { title: isBg ? 'Сила 1 (Recruit)' : 'Power 1 (Recruit)', desc: isBg ? 'Изтеглете 1 карта от тестето си.' : 'Draw 1 card from your deck.' },
        { title: isBg ? 'Сила 2 (Berserk)' : 'Power 2 (Berserk)', desc: isBg ? 'Може да атакува този ход.' : 'Can attack this turn.' }
      ];
      case 'hearts': return [
        { title: isBg ? 'Сила 1 (Feed)' : 'Power 1 (Feed)', desc: isBg ? 'Увеличете живота на приятелска карта за 1 ход или излекувайте LP. Преливането нанася щети на опонента.' : 'Increase a friendly cards health for 1 turn or heal player. Overheal deals damage to opponent.' },
        { title: isBg ? 'Сила 2 (Sap)' : 'Power 2 (Sap)', desc: isBg ? 'Нанесете директни щети на опонента.' : 'Deal direct damage to the opponent.' }
      ];
      case 'spades': return [
        { title: isBg ? 'Сила 1 (Bulwark)' : 'Power 1 (Bulwark)', desc: isBg ? 'Поставете картата на бойното поле, за да предпазва останалите приятелски карти.' : 'Place card in front lane to protect other friendly board cards.' },
        { title: isBg ? 'Сила 2 (Knock out)' : 'Power 2 (Knock out)', desc: isBg ? 'Зашеметете една вражеска карта за 1 ход.' : 'Stun one enemy board card for 1 turn.' }
      ];
      case 'clubs': return [
        { title: isBg ? 'Сила 1 (Kamikaze)' : 'Power 1 (Kamikaze)', desc: isBg ? 'Нанесете щети на всички вражески карти. Картата се побеждава.' : 'Deal damage to all enemy board cards. Card is defeated.' },
        { title: isBg ? 'Сила 2 (Detonate)' : 'Power 2 (Detonate)', desc: isBg ? 'Нанесете щети на една вражеска карта.' : 'Deal damage to one enemy board card.' }
      ];
      default: return [];
    }
  };

  // Helper to describe Elite abilities
  const getEliteAbilities = (suit, rank) => {
    const isBg = language === 'bg';
    if (suit === 'diamonds') {
      if (rank === 'J') return isBg ? [
        'Берсерк и Теглене: Атакувайте веднага и изтеглете 1 карта',
        'Щит: Вземете предпазен щит'
      ] : [
        'Haste & Draw: Attack immediately and draw 1 card',
        'Shield: Gain protective bubble'
      ];
      if (rank === 'Q') return isBg ? [
        'Берсерк и Теглене: Атакувайте веднага и изтеглете 2 карти',
        'Щит: Вземете предпазен щит'
      ] : [
        'Haste & Draw: Attack immediately and draw 2 cards',
        'Shield: Gain protective bubble'
      ];
      if (rank === 'K') return isBg ? [
        'Берсерк и Теглене: Атакувайте веднага и изтеглете 3 карти',
        'Щит: Вземете предпазен щит'
      ] : [
        'Haste & Draw: Attack immediately and draw 3 cards',
        'Shield: Gain protective bubble'
      ];
      if (rank === 'A') return isBg ? [
        'Подслой (Underlay): Прикачете под елитен борд за каро сили',
        'Симетрично теглене: Двамата играчи теглят 4 карти'
      ] : [
        'Underlay: Attach under a board Elite to grant it Diamonds powers',
        'Symmetrical Draw: Both players draw 4 cards'
      ];
    }
    if (suit === 'hearts') {
      if (rank === 'A') return isBg ? [
        'Подслой (Underlay): Прикачете под елитен борд за купа сили',
        'Симетричен здравен буст: И двамата играчи получават +50 LP към максималния и текущия си живот'
      ] : [
        'Underlay: Attach under a board Elite to grant it Hearts powers',
        'Symmetrical Health Boost: Both players\' health is increased by 50 LP'
      ];
      const val = rank === 'J' ? 12 : rank === 'Q' ? 13 : 14;
      return isBg ? [
        `Контрол на ума: Поемете контрол над вражеска карта с атака <= ${limitForRank(rank)}`,
        `Симетричен прилив: Излекувайте приятелските карти с ${val} И нанесете ${val} щети на вражеските LP`
      ] : [
        `Mind Control: Take control of enemy card with ATK <= ${limitForRank(rank)}`,
        `Symmetrical Surge: Heal friendly characters by ${val} AND deal ${val} damage to enemy LP`
      ];
    }
    if (suit === 'spades') {
      if (rank === 'A') return isBg ? [
        'Подслой (Underlay): Прикачете под елитен борд за пика сили',
        'Глобално зашеметяване: Зашеметете всички карти на борда за 4 хода'
      ] : [
        'Underlay: Attach under a board Elite to grant it Spades powers',
        'Global Stun: Stun all board cards (both players) for 4 turns'
      ];
      const turns = rank === 'J' ? 1 : rank === 'Q' ? 2 : 3;
      const allowedText = isBg 
        ? (rank === 'J' ? 'А или J' : rank === 'Q' ? 'А, J или Q' : 'А, J, Q или К')
        : (rank === 'J' ? 'A or J' : rank === 'Q' ? 'A, J or Q' : 'A, J, Q or K');
      return isBg ? [
        `Станете Танк и зашеметете всички вражески карти на борда за ${turns} ход(а)`,
        `Търсене на Елит: Изберете една Елитна карта (${allowedText}) от тестето или купата с победени`
      ] : [
        `Become Tank and stun all enemy board cards for ${turns} turn(s)`,
        `Search Elite: Pick one Elite card (${allowedText}) from deck or defeated pile and draw it`
      ];
    }
    if (suit === 'clubs') {
      if (rank === 'A') return isBg ? [
        'Подслой (Underlay): Прикачете под елитен борд за спатия сили',
        'Изчистване на борда: Победете всички карти на борда и за двамата играчи'
      ] : [
        'Underlay: Attach under a board Elite to grant it Clubs powers',
        'Board Wipe: Defeat all cards on board for both players'
      ];
      const dmg = rank === 'J' ? 12 : rank === 'Q' ? 13 : 14;
      const count = rank === 'J' ? 2 : rank === 'Q' ? 3 : 4;
      return isBg ? [
        `Детонация: Нанесете ${dmg} щети на всички вражески карти на борда`,
        `Призоваване: Възкресете ${count} победени нормални карти Спатия`
      ] : [
        `Detonation: Deal ${dmg} damage to all enemy board cards`,
        `Summon: Resurrect ${count} defeated normal Clubs cards`
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

  const getViableMindControlTargets = (eliteCard) => {
    const limit = limitForRank(eliteCard.rank);
    return oppPState.board.filter(c => c.atk <= limit);
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
          const viable = oppPState.board.filter(c => !c.isElite);
          if (viable.length === 1) {
            onPlayNormal(card.id, 0, viable[0].id);
            resetStates();
          } else if (viable.length > 1) {
            setTargetingMode('STUN');
            setSelectedPowerIdx(0);
          } else {
            onPlayNormal(card.id, 0);
            resetStates();
          }
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
      const viable = oppPState.board.filter(c => !c.isElite);
      if (viable.length === 1) {
        onPlayNormal(selectedHandCard.id, powerIdx, viable[0].id);
        resetStates();
      } else if (viable.length > 1) {
        setTargetingMode('STUN');
      } else {
        onPlayNormal(selectedHandCard.id, powerIdx);
        resetStates();
      }
    } else if (suit === 'clubs' && powerIdx === 1 && oppPState.board.length > 0) {
      // Shield Strike needs target
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
      const viable = getViableMindControlTargets(selectedHandCard);
      if (viable.length === 1) {
        onPlayElite(selectedHandCard.id, 0, { targetId: viable[0].id });
        resetStates();
      } else if (viable.length > 1) {
        setTargetingMode('MIND_CONTROL');
      } else {
        onPlayElite(selectedHandCard.id, 0);
        resetStates();
      }
      return;
    }

    // Spades Search Elite from Deck (index 1 for J, Q, K)
    if (suit === 'spades' && rank !== 'A' && abilityIdx === 1) {
      const allowed = rank === 'J' ? ['A', 'J'] : rank === 'Q' ? ['A', 'J', 'Q'] : ['A', 'J', 'Q', 'K'];
      setSearchAllowedRanks(allowed);
      setSearchConfirmCallback(() => (chosenCardId) => {
        onPlayElite(selectedHandCard.id, 1, { searchCardId: chosenCardId });
        resetSearchState();
        resetStates();
      });
      setIsSearchModalOpen(true);
      return;
    }

    // Direct elite play with no targeting
    onPlayElite(selectedHandCard.id, abilityIdx);
    resetStates();
  };

  // 4. Click a board card (could be attacker, combat defender, stun target, heal target, or underlay target)
  const handleBoardCardClick = (card, playerOwner) => {
    const isMyTurn = gameState.mode === 'online' ? (activePlayer === onlineRole) : true;
    if (isAiTurn || winner || !isMyTurn) return;

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
      const activeElite = pendingUnderlayAce ? selectedEliteForUnderlay : selectedHandCard;
      if (activeElite) {
        const limit = limitForRank(activeElite.rank);
        if (card.atk <= limit) {
          if (pendingUnderlayAce) {
            onPlayUnderlay(pendingUnderlayAce.id, selectedEliteForUnderlay.id, 0, { targetId: card.id });
          } else {
            onPlayElite(selectedHandCard.id, 0, { targetId: card.id });
          }
          resetStates();
        }
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
      const tanks = oppPState.board.filter(c => c.isTank && !(c.stunnedTurns > 0));
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

    if (pendingUnderlayAce.suit === 'spades' && abilityIdx === 1) {
      const allowed = selectedEliteForUnderlay.rank === 'J' ? ['A', 'J'] : selectedEliteForUnderlay.rank === 'Q' ? ['A', 'J', 'Q'] : ['A', 'J', 'Q', 'K'];
      setSearchAllowedRanks(allowed);
      setSearchConfirmCallback(() => (chosenCardId) => {
        onPlayUnderlay(pendingUnderlayAce.id, selectedEliteForUnderlay.id, 1, { searchCardId: chosenCardId });
        resetSearchState();
        resetStates();
      });
      setIsSearchModalOpen(true);
      return;
    }

    if (pendingUnderlayAce.suit === 'hearts' && abilityIdx === 0) {
      const viable = getViableMindControlTargets(selectedEliteForUnderlay);
      if (viable.length === 1) {
        onPlayUnderlay(pendingUnderlayAce.id, selectedEliteForUnderlay.id, 0, { targetId: viable[0].id });
        resetStates();
      } else if (viable.length > 1) {
        setTargetingMode('MIND_CONTROL');
      } else {
        onPlayUnderlay(pendingUnderlayAce.id, selectedEliteForUnderlay.id, 0);
        resetStates();
      }
      return;
    }

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
    const hasTank = oppPState.board.some(c => c.isTank && !(c.stunnedTurns > 0));
    if (targetingMode === 'ATTACK' && !hasTank) {
      onAttackPlayer(attackerCard.id);
      resetStates();
    }
  };

  const resetSearchState = () => {
    setIsSearchModalOpen(false);
    setSearchAllowedRanks([]);
    setSearchConfirmCallback(null);
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
    resetSearchState();
  };

  // Cancel action
  const handleCancelAction = () => {
    resetStates();
  };

  // Render lanes: Single horizontal lane with Tanks shifted forward
  const renderBoardLane = (boardCards, playerOwner) => {
    const isTopPlayer = playerOwner === 'B';
    const laneClass = playerOwner === activePlayer ? 'friendly-lane' : 'opponent-lane';

    const renderCardInstance = (card) => {
      const isOpponentOfActive = playerOwner !== activePlayer;
      let isTargetable = false;
      if (targetingMode === 'STUN' && isOpponentOfActive) {
        if (selectedHandCard && !selectedHandCard.isElite) {
          isTargetable = !card.isElite; // Normal cards can only stun normal cards!
        } else {
          isTargetable = true;
        }
      }
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
        const tanks = oppPState.board.filter(c => c.isTank && !(c.stunnedTurns > 0));
        if (tanks.length > 0) {
          isTargetable = card.isTank; // Must attack tank
        } else {
          isTargetable = true;
        }
      }

      const isAttackReady = activePlayer === playerOwner && !isAiTurn && !winner && !targetingMode && !isUnderlayTargeting && canCardAttack(card);

      const tankShiftStyle = card.isTank
        ? { position: 'relative', transform: `translateY(${isTopPlayer ? 40 : -40}px)`, zIndex: 10 }
        : { position: 'relative', zIndex: 1 };

      return (
        <div key={card.id} style={tankShiftStyle}>
          <Card 
            card={card} 
            onClick={() => handleBoardCardClick(card, playerOwner)}
            isTargetable={isTargetable}
            isAttackReady={isAttackReady}
            language={language}
          />
        </div>
      );
    };

    return (
      <div className={laneClass} style={{ display: 'flex', width: '100%' }}>
        <div className="board-lane" style={{ minHeight: '120px', position: 'relative' }}>
          {boardCards.map(renderCardInstance)}
        </div>
      </div>
    );
  };

  const cannotPlayAny = activePState.hand.length === 0 || activePState.cardsPlayedThisTurn >= getPlayLimit(activePState.lp, activePState.has10CardBuff);
  const noReadyAttackers = !activePState.board.some(c => canCardAttack(c));
  const isEndTurnPulsing = !winner && !isAiTurn && cannotPlayAny && noReadyAttackers && !targetingMode && !isUnderlayTargeting;

  return (
    <div className="gameplay-arena">
      {/* Targeting Indicator Banner */}
      {targetingMode && (
        <div className="targeting-indicator-banner">
          <span>
            {targetingMode === 'HEAL' && t.targetingHeal}
            {targetingMode === 'STUN' && (selectedHandCard?.suit === 'clubs' ? t.targetingShieldStrike : t.targetingStun)}
            {targetingMode === 'MIND_CONTROL' && t.targetingMindControl}
            {targetingMode === 'ATTACK' && t.targetingAttack}
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
            {t.cancel}
          </button>
        </div>
      )}

      {isUnderlayTargeting && (
        <div className="targeting-indicator-banner" style={{ background: 'var(--color-spades)' }}>
          <span>{language === 'bg' ? 'Изберете приятелска Елитна карта на вашия борд, под която да поставите Асото!' : 'Select a friendly Elite card on your board to underlay the Ace!'}</span>
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
            {t.cancel}
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
              <div className="hp-bar-fill" style={{ width: `${(pB.lp / (pB.maxLp || 150)) * 100}%` }} />
            </div>
            {pB.has10CardBuff && <span className="active-buff-badge">{language === 'bg' ? 'БЪФ ЗА РЪКА ОТ 10 КАРТИ' : '10-CARD HAND BUFF'}</span>}
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
              {language === 'bg' ? 'Изиграни' : 'Plays'}: {pB.cardsPlayedThisTurn}/{getPlayLimit(pB.lp, pB.has10CardBuff)}
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
            const showBack = gameState.mode === 'ai' ? true : (gameState.mode === 'online' ? (onlineRole !== 'B') : (activePlayer !== 'B'));
            const isPlayable = activePlayer === 'B' && !winner && (gameState.mode === 'online' ? (onlineRole === 'B') : (gameState.mode !== 'ai')) && pB.cardsPlayedThisTurn < getPlayLimit(pB.lp, pB.has10CardBuff);
            return (
              <Card 
                key={card.id || i} 
                card={card} 
                showBack={showBack} 
                onClick={isPlayable ? () => handleHandCardClick(card) : undefined}
                isPlayable={isPlayable}
                language={language}
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
              {language === 'bg' ? 'Ход' : 'Turn'} {turnCount}
            </div>
            <button 
              className={`btn-premium ${isEndTurnPulsing ? 'btn-pulsate' : ''}`}
              disabled={isAiTurn || !!winner || (gameState.mode === 'online' && activePlayer !== onlineRole)}
              onClick={onEndTurn}
            >
              {t.endTurn}
            </button>
          </div>

          {/* Friendly board (Player A) */}
          {renderBoardLane(pA.board, 'A')}
        </div>

        {/* Friendly Hand (Player A) */}
        <div className="hand-container">
          {pA.hand.map((card, i) => {
            const showBack = gameState.mode === 'ai' ? false : (gameState.mode === 'online' ? (onlineRole !== 'A') : (activePlayer !== 'A'));
            const isPlayable = activePlayer === 'A' && !winner && (gameState.mode === 'online' ? (onlineRole === 'A') : true) && pA.cardsPlayedThisTurn < getPlayLimit(pA.lp, pA.has10CardBuff);
            return (
              <Card 
                key={card.id || i} 
                card={card} 
                showBack={showBack}
                onClick={isPlayable ? () => handleHandCardClick(card) : undefined}
                isPlayable={isPlayable}
                language={language}
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
              <div className="hp-bar-fill" style={{ width: `${(pA.lp / (pA.maxLp || 150)) * 100}%` }} />
            </div>
            {pA.has10CardBuff && <span className="active-buff-badge">{language === 'bg' ? 'БЪФ ЗА РЪКА ОТ 10 КАРТИ' : '10-CARD HAND BUFF'}</span>}
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
              {language === 'bg' ? 'Изиграни' : 'Plays'}: {pA.cardsPlayedThisTurn}/{getPlayLimit(pA.lp, pA.has10CardBuff)}
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
      <div className="sidebar-panel">
        <div className="deck-pile-indicators">
          <div className="deck-status-box">
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{language === 'bg' ? 'ТЕСТЕ' : 'DECK'} ({activePlayer === 'A' ? 'P1' : 'P2'})</div>
            <div style={{ fontSize: '1.25rem', fontWeight: '800' }}>{activePlayer === 'A' ? pA.deck.length : pB.deck.length}</div>
          </div>
          <div className="deck-status-box" style={{ borderLeftColor: 'var(--color-hearts)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{language === 'bg' ? 'ПОБЕДЕНИ' : 'DEFEATED'} ({activePlayer === 'A' ? 'P1' : 'P2'})</div>
            <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--color-hearts)' }}>{activePlayer === 'A' ? pA.defeated.length : pB.defeated.length}</div>
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
          {language === 'bg' ? 'Щети от умора:' : 'Fatigue Draw count:'} {gameState.defeatedDrawsCount.A} (P1) / {gameState.defeatedDrawsCount.B} (P2)
        </div>

        {/* Battle Feed Logs under fatigue draw count */}
        <GameLogs logs={gameState.logs} language={language} isEmbedded={true} />
      </div>

      {/* Normal Card Power Choice Modal */}
      {isPowerModalOpen && selectedHandCard && (
        <div className="card-modal-backdrop" onClick={handleCancelAction}>
          <div className="glass-panel card-modal-content" onClick={(e) => e.stopPropagation()} style={{ borderTop: `4px solid ${SUIT_LABELS[selectedHandCard.suit].color}` }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '700' }}>{t.activateCardPower}</h3>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span className={`card-suit-symbol ${selectedHandCard.suit}`}>{SUIT_LABELS[selectedHandCard.suit].symbol}</span>
              <span style={{ fontSize: '1.1rem', fontWeight: '600' }}>{selectedHandCard.suit.toUpperCase()} {selectedHandCard.value}</span>
            </div>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>
              {language === 'bg' ? 'Изберете една от силите на боята, за да се активира при изиграване на картата:' : 'Choose one of the suit abilities to activate when playing this card:'}
            </p>

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
            <button className="btn-premium" onClick={handleCancelAction} style={{ marginTop: '10px' }}>{t.cancel}</button>
          </div>
        </div>
      )}

      {/* Elite Card Ability Choice Modal */}
      {isEliteModalOpen && selectedHandCard && (
        <div className="card-modal-backdrop" onClick={handleCancelAction}>
          <div className="glass-panel card-modal-content" onClick={(e) => e.stopPropagation()} style={{ borderTop: `4px solid ${SUIT_LABELS[selectedHandCard.suit].color}` }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '700' }}>{t.activateEliteAbility}</h3>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span className={`card-suit-symbol ${selectedHandCard.suit}`}>{SUIT_LABELS[selectedHandCard.suit].symbol}</span>
              <span style={{ fontSize: '1.1rem', fontWeight: '600' }}>
                {language === 'bg' ? `Елитен ${selectedHandCard.rank} на ${selectedHandCard.suit.toUpperCase()}` : `Elite ${selectedHandCard.rank} of ${selectedHandCard.suit.toUpperCase()}`}
              </span>
            </div>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>{language === 'bg' ? 'Изберете една от елитните способности за активиране:' : 'Choose one of the elite abilities to trigger:'}</p>

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
            <button className="btn-premium" onClick={handleCancelAction} style={{ marginTop: '10px' }}>{t.cancel}</button>
          </div>
        </div>
      )}

      {/* Underlay Ace Ability Choice Modal */}
      {isUnderlayPowerModalOpen && pendingUnderlayAce && selectedEliteForUnderlay && (
        <div className="card-modal-backdrop">
          <div className="glass-panel card-modal-content" style={{ borderTop: `4px solid ${SUIT_LABELS[pendingUnderlayAce.suit].color}` }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '700' }}>{language === 'bg' ? 'Изберете сила на подслой' : 'Choose Underlay Power'}</h3>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>
              {language === 'bg' ? `Поставяте Асо на ${pendingUnderlayAce.suit.toUpperCase()} под вашия активен Елит ${selectedEliteForUnderlay.rank}. Изберете коя ${pendingUnderlayAce.suit.toUpperCase()} сила с ранг ${selectedEliteForUnderlay.rank} да се активира:` : `You are placing the Ace of ${pendingUnderlayAce.suit.toUpperCase()} under your active Elite ${selectedEliteForUnderlay.rank}. Choose which ${pendingUnderlayAce.suit.toUpperCase()} power of rank ${selectedEliteForUnderlay.rank} to activate:`}
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

      {/* Search Elite Card from Deck Modal */}
      {isSearchModalOpen && (
        <div className="card-modal-backdrop" onClick={handleCancelAction}>
          <div className="glass-panel card-modal-content" onClick={(e) => e.stopPropagation()} style={{ borderTop: '4px solid var(--color-spades)', maxWidth: '600px', width: '90%' }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '700' }}>{t.searchEliteTitle}</h3>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', marginBottom: '16px' }}>
              {t.searchEliteDesc.replace('{ranks}', searchAllowedRanks.join(', '))}
            </p>

            {(() => {
              const myDeck = activePlayer === 'A' ? pA.deck : pB.deck;
              const allDefeated = [...pA.defeated, ...pB.defeated];
              
              const eligibleDeckElites = myDeck.filter(c => c.isElite && searchAllowedRanks.includes(c.rank)).map(c => ({ ...c, fromPile: 'deck' }));
              const eligibleDefeatedElites = allDefeated.filter(c => c.isElite && searchAllowedRanks.includes(c.rank)).map(c => ({ ...c, fromPile: 'defeated' }));
              
              const eligibleElites = [...eligibleDeckElites, ...eligibleDefeatedElites];

              if (eligibleElites.length === 0) {
                return (
                  <div style={{ textAlign: 'center', margin: '20px 0' }}>
                    <p style={{ color: 'var(--text-bright)', fontWeight: '600', marginBottom: '15px' }}>
                      {t.noElitesFound}
                    </p>
                    <button 
                      className="btn-premium btn-spades" 
                      onClick={() => {
                        if (searchConfirmCallback) searchConfirmCallback(null);
                      }}
                    >
                      {t.confirmNoDraw}
                    </button>
                  </div>
                );
              }

              return (
                <div>
                  <div style={{ 
                    display: 'flex', 
                    gap: '16px', 
                    flexWrap: 'wrap', 
                    justifyContent: 'center', 
                    margin: '20px 0',
                    maxHeight: '300px',
                    overflowY: 'auto',
                    padding: '10px'
                  }}>
                    {eligibleElites.map((card, idx) => (
                      <div 
                        key={card.id || idx}
                        style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                        onClick={() => {
                          if (searchConfirmCallback) searchConfirmCallback(card.id);
                        }}
                      >
                        <Card card={card} isPlayable={true} language={language} />
                        {card.fromPile === 'defeated' ? (
                          <span style={{ 
                            fontSize: '0.7rem', 
                            color: '#ff4d4d', 
                            fontWeight: '600', 
                            marginTop: '6px',
                            background: 'rgba(255, 77, 77, 0.15)',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            border: '1px solid rgba(255, 77, 77, 0.3)',
                            whiteSpace: 'nowrap'
                          }}>
                            {t.defeatedLabel}
                          </span>
                        ) : (
                          <span style={{ 
                            fontSize: '0.7rem', 
                            color: '#4da6ff', 
                            fontWeight: '600', 
                            marginTop: '6px',
                            background: 'rgba(77, 166, 255, 0.15)',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            border: '1px solid rgba(77, 166, 255, 0.3)',
                            whiteSpace: 'nowrap'
                          }}>
                            {t.deckLabel}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <button className="btn-premium" onClick={handleCancelAction}>{t.cancelPlay}</button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
