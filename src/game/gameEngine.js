import { SUBSECTIONS, createCard, buildDeck, getPairedSubsectionId, generateElites } from './deckBuilder.js';

export function getPlayLimit(lp, has10CardBuff = false) {
  if (has10CardBuff) return 3;
  if (lp <= 50) return 3;
  if (lp <= 100) return 2;
  return 1;
}

export function canCardAttack(card) {
  if (card.stunnedTurns > 0) return false;
  if (card.playedThisTurn && !card.hasHaste) return false;
  
  const maxAttacks = card.maxAttacks || 1;
  return card.attackedThisTurn < maxAttacks;
}

export function getInitialGameState(mode = 'hotseat', startingPlayer = 'A') {
  return {
    mode, // 'hotseat' or 'ai'
    phase: 'DRAFT_NORMAL', // 'DRAFT_NORMAL', 'DRAFT_ELITE', 'DRAFT_ELITE_SELECT', 'GAMEPLAY', 'GAME_OVER'
    winner: null,
    
    // Draft state
    draft: {
      startingPlayer, // Track who starts draft first
      availableSubsections: [...SUBSECTIONS],
      currentDrafter: startingPlayer, // 'A' or 'B'
      step: 1, // 1 to 4 for normal draft
      playerANormals: [], // drafted normal card values (card objects)
      playerBNormals: [],
      
      // Elite draft
      availableElites: generateElites(),
      eliteDraftStep: 1, // Increments for turns in categories
      currentEliteCategory: null, // Dynamic: starter chooses rank
      eliteCategorySelector: startingPlayer, // swaps each round
      draftedElitesA: [], // All drafted elites for A (up to 8)
      draftedElitesB: [], // All drafted elites for B (up to 8)
      
      // Elite final selection (selecting 4 from 8)
      finalElitesA: [], // Chosen 4 Elites
      finalElitesB: [],
      selectionTurn: startingPlayer // Who is currently choosing their final 4 elites
    },
    
    // Players state
    players: {
      A: {
        id: 'A',
        name: 'Player A',
        lp: 150,
        maxLp: 150,
        deck: [],
        hand: [],
        board: [],
        has10CardBuff: false,
        hasBoardBarrierBuff: false,
        cardsPlayedThisTurn: 0
      },
      B: {
        id: 'B',
        name: mode === 'ai' ? 'Computer (AI)' : 'Player B',
        lp: 150,
        maxLp: 150,
        deck: [],
        hand: [],
        board: [],
        has10CardBuff: false,
        hasBoardBarrierBuff: false,
        cardsPlayedThisTurn: 0
      }
    },
    
    activePlayer: startingPlayer, // 'A' or 'B'
    turnCount: 1,
    defeatedDrawsCount: { A: 0, B: 0 }, // fatigue counters
    defeated: [], // Defeated Pile (FIFO queue)
    resurrectionCandidate: null, // { card, threshold }
    logs: [],
    
    // Actions requiring user selection
    pendingPlay: null // { card, powerIndex, sourceIndex }
  };
}

// Log utility
export function logEvent(state, message) {
  state.logs.push(`[Turn ${state.turnCount} - ${state.activePlayer === 'A' ? 'P1' : 'P2'}]: ${message}`);
}

// Check and update the 10-card hand buff state for both players
export function update10CardBuff(playerState) {
  if (playerState.hand.length === 10) {
    if (!playerState.has10CardBuff) {
      playerState.has10CardBuff = true;
    }
  }
}

// Check and update the 10-cards on board buff state for a player
export function checkBoardBarrierBuff(state, player) {
  const pState = state.players[player];
  if (!pState) return;
  const boardSize = pState.board.length;
  
  if (boardSize >= 10) {
    if (!pState.hasBoardBarrierBuff) {
      pState.hasBoardBarrierBuff = true;
      pState.board.forEach(card => {
        card.shield = true;
      });
      logEvent(state, `10-CARDS ON BOARD BUFF! All friendly board cards gain a protective barrier!`);
    }
  } else if (boardSize <= 6) {
    if (pState.hasBoardBarrierBuff) {
      pState.hasBoardBarrierBuff = false;
      logEvent(state, `Board cards for ${pState.name} dropped to ${boardSize}. 10-cards board barrier buff has reset.`);
    }
  }
}

// Draw card function
export function drawCard(state, player) {
  const pState = state.players[player];
  
  if (pState.deck.length === 0) {
    // Defeated Pile (FIFO Queue) draw
    if (state.defeated.length > 0) {
      const card = state.defeated.shift();
      state.defeatedDrawsCount[player] += 1;
      const fatigueDamage = state.defeatedDrawsCount[player];
      pState.lp = Math.max(0, pState.lp - fatigueDamage);
      
      // Reset card stats when drawn back
      card.atk = card.baseAtk;
      card.hp = card.baseHp;
      card.maxHp = card.baseHp;
      card.shield = false;
      card.isTank = false;
      card.stunnedTurns = 0;
      card.underlays = [];
      card.attackedThisTurn = 0;
      card.hasHaste = false;
      
      pState.hand.push(card);
      logEvent(state, `${pState.name} draws ${card.rank || card.value} of ${card.suit.toUpperCase()} from DEFEATED pile, taking ${fatigueDamage} fatigue damage!`);
      update10CardBuff(pState);
      
      if (pState.lp <= 0) {
        state.winner = player === 'A' ? 'B' : 'A';
        state.phase = 'GAME_OVER';
        logEvent(state, `${pState.name} died to fatigue damage. Game Over!`);
      }
    } else {
      // Empty defeated pile as well: just take fatigue damage
      state.defeatedDrawsCount[player] += 1;
      const fatigueDamage = state.defeatedDrawsCount[player];
      pState.lp = Math.max(0, pState.lp - fatigueDamage);
      logEvent(state, `${pState.name} tried to draw but deck and defeated piles are empty! Takes ${fatigueDamage} fatigue damage!`);
      
      if (pState.lp <= 0) {
        state.winner = player === 'A' ? 'B' : 'A';
        state.phase = 'GAME_OVER';
        logEvent(state, `${pState.name} died to fatigue damage. Game Over!`);
      }
    }
    return;
  }
  
  const card = pState.deck.shift();
  pState.hand.push(card);
  logEvent(state, `${pState.name} draws a card.`);
  update10CardBuff(pState);
}

// Normal Subsection Drafting - Even only, Odd paired, auto-completed at the end
export function draftNormalSubsection(state, subsectionId) {
  if (state.phase !== 'DRAFT_NORMAL') return state;
  
  const draftState = state.draft;
  const currentDrafter = draftState.currentDrafter;
  const opponent = currentDrafter === 'A' ? 'B' : 'A';
  
  // Validation: must end with _even
  if (!subsectionId.endsWith('_even')) return state;
  
  const subIdx = draftState.availableSubsections.findIndex(s => s.id === subsectionId);
  if (subIdx === -1) return state;
  
  const selectedSub = draftState.availableSubsections[subIdx];
  const pairedSubId = getPairedSubsectionId(subsectionId);
  const pairIdx = draftState.availableSubsections.findIndex(s => s.id === pairedSubId);
  const pairedSub = draftState.availableSubsections[pairIdx];
  
  // Create card objects
  const selectedCards = selectedSub.cards.map(v => createCard(selectedSub.suit, v, false));
  const pairedCards = pairedSub.cards.map(v => createCard(pairedSub.suit, v, false));
  
  if (currentDrafter === 'A') {
    draftState.playerANormals.push(...selectedCards);
    draftState.playerBNormals.push(...pairedCards);
  } else {
    draftState.playerBNormals.push(...selectedCards);
    draftState.playerANormals.push(...pairedCards);
  }
  
  // Remove from available (remove higher index first to preserve correct splicing)
  const firstIdx = Math.max(subIdx, pairIdx);
  const secondIdx = Math.min(subIdx, pairIdx);
  draftState.availableSubsections.splice(firstIdx, 1);
  draftState.availableSubsections.splice(secondIdx, 1);
  
  logEvent(state, `${currentDrafter === 'A' ? 'Player A' : 'Player B'} drafted Even subsection ${selectedSub.id.split('_')[0].toUpperCase()}. Paired Odd goes to other player.`);
  
  const starter = draftState.startingPlayer || 'A';
  const follower = starter === 'A' ? 'B' : 'A';

  // Advancing steps dynamically
  if (draftState.step === 1) {
    draftState.step = 2;
    draftState.currentDrafter = follower;
  } else if (draftState.step === 2) {
    // Step 2 needs 2 selections by follower
    const remainingEvens = draftState.availableSubsections.filter(s => s.type === 'even');
    if (remainingEvens.length === 2) {
      draftState.currentDrafter = follower; // Need 1 more choice from follower
    } else {
      // Follower finished drafting both. Now auto-assign last Even to starter
      const lastEven = remainingEvens[0];
      const lastPairedId = getPairedSubsectionId(lastEven.id);
      const lastPair = draftState.availableSubsections.find(s => s.id === lastPairedId);
      
      const lastEvenCards = lastEven.cards.map(v => createCard(lastEven.suit, v, false));
      const lastOddCards = lastPair.cards.map(v => createCard(lastPair.suit, v, false));
      
      if (starter === 'A') {
        draftState.playerANormals.push(...lastEvenCards);
        draftState.playerBNormals.push(...lastOddCards);
      } else {
        draftState.playerBNormals.push(...lastEvenCards);
        draftState.playerANormals.push(...lastOddCards);
      }
      
      logEvent(state, `${starter === 'A' ? 'Player A' : 'Player B'} automatically receives remaining Even subsection ${lastEven.id.split('_')[0].toUpperCase()}. Paired Odd goes to ${follower === 'A' ? 'Player A' : 'Player B'}.`);
      
      // Clear pool
      draftState.availableSubsections = [];
      
      // Transition to Elites!
      state.phase = 'DRAFT_ELITE';
      draftState.currentEliteCategory = null; // Any category can be selected first
      draftState.eliteCategorySelector = starter; // Starter of normal cards starts again in elite cards!
      draftState.currentDrafter = starter;
      draftState.eliteDraftStep = 1;
    }
  }
  
  return state;
}

// Elite Drafting with Dynamic Category Selector and swapping starters
export function draftEliteCard(state, cardId) {
  if (state.phase !== 'DRAFT_ELITE') return state;
  
  const draftState = state.draft;
  const currentDrafter = draftState.currentDrafter;
  const opponent = currentDrafter === 'A' ? 'B' : 'A';
  
  const cardIdx = draftState.availableElites.findIndex(c => c.id === cardId);
  if (cardIdx === -1) return state;
  
  const card = draftState.availableElites[cardIdx];
  
  if (draftState.currentEliteCategory === null) {
    // Selection state: Active drafter (which is the current eliteCategorySelector) picks any rank
    if (currentDrafter !== draftState.eliteCategorySelector) return state; // Only selector can choose rank
    
    const category = card.rank;
    draftState.currentEliteCategory = category;
    
    // Assign card to selector
    if (currentDrafter === 'A') {
      draftState.draftedElitesA.push(card);
    } else {
      draftState.draftedElitesB.push(card);
    }
    draftState.availableElites.splice(cardIdx, 1);
    logEvent(state, `${currentDrafter === 'A' ? 'Player A' : 'Player B'} chooses category ${category} and drafts Elite ${card.rank} of ${card.suit.toUpperCase()}`);
    
    // Opponent picks 2 cards of this category
    draftState.eliteDraftStep = 2;
    draftState.currentDrafter = opponent;
  } else {
    // Active category drafting state: card must match active category
    if (card.rank !== draftState.currentEliteCategory) return state;
    
    // Assign card
    if (currentDrafter === 'A') {
      draftState.draftedElitesA.push(card);
    } else {
      draftState.draftedElitesB.push(card);
    }
    draftState.availableElites.splice(cardIdx, 1);
    logEvent(state, `${currentDrafter === 'A' ? 'Player A' : 'Player B'} drafted Elite ${card.rank} of ${card.suit.toUpperCase()}`);
    
    // Advance step
    if (draftState.eliteDraftStep === 2) {
      draftState.eliteDraftStep = 3;
      // currentDrafter stays the same (opponent drafts 2)
    } else if (draftState.eliteDraftStep === 3) {
      // Opponent drafted their 2nd card. Auto-assign remaining card to eliteCategorySelector.
      const category = draftState.currentEliteCategory;
      const selector = draftState.eliteCategorySelector;
      
      const remainingIdx = draftState.availableElites.findIndex(c => c.rank === category);
      if (remainingIdx !== -1) {
        const remainingCard = draftState.availableElites[remainingIdx];
        if (selector === 'A') {
          draftState.draftedElitesA.push(remainingCard);
        } else {
          draftState.draftedElitesB.push(remainingCard);
        }
        draftState.availableElites.splice(remainingIdx, 1);
        logEvent(state, `${selector === 'A' ? 'Player A' : 'Player B'} automatically receives remaining Elite ${remainingCard.rank} of ${remainingCard.suit.toUpperCase()}`);
      }
      
      // Swap selector for next category round
      const nextSelector = selector === 'A' ? 'B' : 'A';
      draftState.eliteCategorySelector = nextSelector;
      draftState.currentDrafter = nextSelector;
      draftState.currentEliteCategory = null;
      draftState.eliteDraftStep = 1;
      
      // Check if elite draft is complete
      if (draftState.availableElites.length === 0) {
        initializeGameDecks(state);
      }
    }
  }
  
  return state;
}

// Select Final 4 Elites
export function selectFinalElites(state, player, cardIds) {
  if (state.phase !== 'DRAFT_ELITE_SELECT') return state;
  const draftState = state.draft;
  
  if (player !== draftState.selectionTurn) return state;
  
  // Validate selected card IDs
  const pool = player === 'A' ? draftState.draftedElitesA : draftState.draftedElitesB;
  const chosenElites = pool.filter(c => cardIds.includes(c.id));
  
  // Ensure player selected exactly 1 of each J, Q, K, A
  const ranks = chosenElites.map(c => c.rank);
  const isValid = chosenElites.length === 4 && 
                  ranks.includes('J') && 
                  ranks.includes('Q') && 
                  ranks.includes('K') && 
                  ranks.includes('A');
                  
  if (!isValid) return state;
  
  if (player === 'A') {
    draftState.finalElitesA = chosenElites;
    draftState.selectionTurn = 'B';
    logEvent(state, `Player A selected their 4 Elite cards.`);
    
    // If VS AI, AI instantly selects
    if (state.mode === 'ai') {
      aiSelectFinalElites(state);
    }
  } else {
    draftState.finalElitesB = chosenElites;
    logEvent(state, `Player B selected their 4 Elite cards.`);
    
    // Both done selecting. Build decks and start!
    initializeGameDecks(state);
  }
  
  return state;
}

// Simple AI selection of final elites (take first matching of each category)
function aiSelectFinalElites(state) {
  const pool = state.draft.draftedElitesB;
  const selection = [];
  ['J', 'Q', 'K', 'A'].forEach(r => {
    const card = pool.find(c => c.rank === r);
    if (card) selection.push(card.id);
  });
  selectFinalElites(state, 'B', selection);
}

// Deck initialization after selection
function initializeGameDecks(state) {
  const pA = state.players.A;
  const pB = state.players.B;
  
  pA.deck = buildDeck(state.draft.playerANormals, state.draft.draftedElitesA);
  pB.deck = buildDeck(state.draft.playerBNormals, state.draft.draftedElitesB);
  
  logEvent(state, "Decks built using spacing constraint. Shuffling normal and elite pools.");
  
  // Initial draw: 6 cards, must not include Elites
  drawInitialHand(state, 'A');
  drawInitialHand(state, 'B');
  
  state.phase = 'GAMEPLAY';
  const gameplayStarter = state.draft.startingPlayer || 'A';
  state.activePlayer = gameplayStarter;
  state.turnCount = 1;
  
  const starterName = gameplayStarter === 'A' ? 'Player A' : (state.mode === 'ai' ? 'Computer (AI)' : 'Player B');
  logEvent(state, `Game initialized! Starting hand drawn (no Elites). Turn 1 starts for ${starterName}.`);
  
  // Start Turn for starter
  startTurn(state);
}

// Initial draw helper: draws the first 6 normal cards, leaving elites in their relative slots
function drawInitialHand(state, player) {
  const pState = state.players[player];
  let normalsDrawn = 0;
  const remainingDeck = [];
  
  for (let i = 0; i < pState.deck.length; i++) {
    const card = pState.deck[i];
    if (!card.isElite && normalsDrawn < 6) {
      pState.hand.push(card);
      normalsDrawn += 1;
    } else {
      remainingDeck.push(card);
    }
  }
  pState.deck = remainingDeck;
  update10CardBuff(pState);
}

// Start Turn
export function startTurn(state) {
  const active = state.activePlayer;
  const pState = state.players[active];
  
  pState.cardsPlayedThisTurn = 0;
  pState.underlaysPlayedThisTurn = 0;
  
  pState.board.forEach(card => {
    card.attackedThisTurn = 0; // reset attack counters
    card.maxAttacks = 1; // reset allowed attacks to default
    card.playedThisTurn = false; // clear summoning sickness
  });
  
  // Draw card step
  if (pState.has10CardBuff) {
    logEvent(state, `${pState.name} is in 10-Card Hand Buff state. Draw phase is FROZEN!`);
  } else {
    drawCard(state, active);
  }
  
  checkBoardBarrierBuff(state, 'A');
  checkBoardBarrierBuff(state, 'B');
  return state;
}

// End Turn
export function endTurn(state) {
  const active = state.activePlayer;
  const pState = state.players[active];
  
  // End of turn cleanup: Restore all surviving board cards back to their base HP (decaying temporary buffs) and decrement stun
  pState.board.forEach(c => {
    c.maxHp = c.baseHp;
    c.hp = c.baseHp;
    if (c.stunnedTurns > 0) {
      c.stunnedTurns -= 1;
      if (c.stunnedTurns === 0) {
        logEvent(state, `${c.rank || c.value} of ${c.suit.toUpperCase()} recovered from stun.`);
      }
    }
  });
  
  // Opponent board cleanup
  const opponent = active === 'A' ? 'B' : 'A';
  state.players[opponent].board.forEach(c => {
    c.maxHp = c.baseHp;
    c.hp = c.baseHp;
  });
  
  // Check if hand size is <= 6 at the end of the turn to deactivate 10-card hand buff
  if (pState.hand.length <= 6) {
    if (pState.has10CardBuff) {
      pState.has10CardBuff = false;
      logEvent(state, `${pState.name} hand is <= 6. 10-Card Hand Buff deactivated.`);
    }
  }
  
  logEvent(state, `${pState.name} ends turn. Surviving board cards fully restored to base HP.`);
  
  // Clear resurrection candidate at end of turn
  state.resurrectionCandidate = null;
  
  // Switch player
  state.activePlayer = opponent;
  if (opponent === 'A') {
    state.turnCount += 1;
  }
  
  // Start turn for new active player
  startTurn(state);
  
  // If VS AI and it's AI's turn, execute AI turn
  if (state.mode === 'ai' && state.activePlayer === 'B' && state.phase === 'GAMEPLAY') {
    // AI turn logic will be triggered in the component or App coordinator
  }
  
  return state;
}

// Healing helper with overheal logic
export function healCharacter(state, player, target, healAmount) {

  if (target === 'player') {
    const pState = state.players[player];
    const prevLp = pState.lp;
    pState.lp += healAmount;
    
    const maxLp = pState.maxLp || 150;
    if (pState.lp > maxLp) {
      const excess = pState.lp - maxLp;
      pState.lp = maxLp;
      // Excess damage to opponent LP
      const opp = player === 'A' ? 'B' : 'A';
      state.players[opp].lp = Math.max(0, state.players[opp].lp - excess);
      logEvent(state, `${pState.name} healed for ${healAmount}. LP capped at ${maxLp}. Excess ${excess} damage dealt to opponent's LP!`);
      
      if (state.players[opp].lp <= 0) {
        state.winner = player;
        state.phase = 'GAME_OVER';
        logEvent(state, `${state.players[opp].name} has fallen! Game Over.`);
      }
    } else {
      logEvent(state, `${pState.name} healed LP for ${healAmount} (LP: ${prevLp} -> ${pState.lp}).`);
    }
  } else {
    // Target is card object (increases HP and max HP for remainder of turn)
    const prevHp = target.hp;
    target.hp += healAmount;
    target.maxHp += healAmount;
    logEvent(state, `Friendly ${target.suit.toUpperCase()} ${target.rank || target.value} healed for ${healAmount} (HP: ${prevHp} -> ${target.hp}, Max HP: ${target.maxHp}).`);
  }
}

// Normal Card Play Resolver
export function playNormalCard(state, cardId, powerIndex, targetInfo = null) {
  const active = state.activePlayer;
  const pState = state.players[active];
  const opp = active === 'A' ? 'B' : 'A';
  const oppState = state.players[opp];
  
  const playLimit = getPlayLimit(pState.lp, pState.has10CardBuff);
  if (pState.cardsPlayedThisTurn >= playLimit) {
    logEvent(state, `Cannot play card. Exceeded play limit of ${playLimit} cards based on health!`);
    return state;
  }
  
  const cardIdx = pState.hand.findIndex(c => c.id === cardId);
  if (cardIdx === -1) return state;
  const card = pState.hand[cardIdx];
  
  // Resolve powers
  const isDual = pState.has10CardBuff;
  
  // Remove card from hand
  pState.hand.splice(cardIdx, 1);
  pState.cardsPlayedThisTurn += 1;
  
  logEvent(state, `Plays ${card.value} of ${card.suit.toUpperCase()}${isDual ? ' [DUAL ACTIVATION]' : ''}`);
  
  // Store powers to execute
  const powersToRun = [];
  if (isDual) {
    powersToRun.push(1, 2);
  } else {
    powersToRun.push(powerIndex + 1);
  }
  
  // Flag to check if card survives play (like Clubs Detonate kills it)
  let shouldPlaceOnBoard = true;
  
  powersToRun.forEach(power => {
    if (card.suit === 'diamonds') {
      if (power === 1) {
        // Draw 1
        drawCard(state, active);
      } else {
        // Berserk (Haste)
        card.hasHaste = true;
        logEvent(state, `${card.suit.toUpperCase()} ${card.value} gains Berserk (Haste/Charge).`);
      }
    } else if (card.suit === 'hearts') {
      if (power === 1) {
        // Heal
        const healAmt = card.value;
        if (targetInfo === 'player' || !targetInfo) {
          healCharacter(state, active, 'player', healAmt);
        } else {
          // Card target
          const targetCard = pState.board.find(c => c.id === targetInfo);
          if (targetCard) {
            healCharacter(state, active, targetCard, healAmt);
          } else {
            // Default to player if card targets not found
            healCharacter(state, active, 'player', healAmt);
          }
        }
      } else {
        // Sap opponent
        oppState.lp = Math.max(0, oppState.lp - card.value);
        logEvent(state, `Sap: Deals ${card.value} damage to opponent's LP (Opponent LP: ${oppState.lp}).`);
        if (oppState.lp <= 0) {
          state.winner = active;
          state.phase = 'GAME_OVER';
          logEvent(state, `${oppState.name} has fallen! Game Over.`);
        }
      }
    } else if (card.suit === 'spades') {
      if (power === 1) {
        // Power 1: Bulwark (Become Tank)
        card.isTank = true;
        logEvent(state, `${card.suit.toUpperCase()} ${card.value} activates Bulwark! (Becomes a Tank)`);
      } else {
        // Power 2: Knock out (Stun one enemy card)
        if (targetInfo) {
          const ecIdx = oppState.board.findIndex(c => c.id === targetInfo);
          if (ecIdx !== -1) {
            const ec = oppState.board[ecIdx];
            if (ec.isElite) {
              logEvent(state, `Cannot stun Elite card ${ec.rank} of ${ec.suit.toUpperCase()} with a Normal Spades card!`);
              return state;
            }
            ec.stunnedTurns = (ec.stunnedTurns || 0) + 1;
            logEvent(state, `${card.value} of ${card.suit.toUpperCase()} activates Knock out on enemy ${ec.rank || ec.value} of ${ec.suit.toUpperCase()} for 1 turn!`);
          }
        }
      }
    } else if (card.suit === 'clubs') {
      if (power === 1) {
        // Power 1: Kamikaze (AOE damage to all enemy board cards, self-destructs unless dual active)
        if (!isDual) {
          shouldPlaceOnBoard = false;
        }
        logEvent(state, `Kamikaze! Deals ${card.value} Clubs damage to all enemy board cards.`);
        for (let i = oppState.board.length - 1; i >= 0; i--) {
          const ec = oppState.board[i];
          if (ec.shield) {
            const shieldThreshold = ec.hp;
            if (card.value >= shieldThreshold) {
              ec.shield = false;
              logEvent(state, `Enemy ${ec.rank || ec.value} of ${ec.suit.toUpperCase()}'s shield bubble POPPED by Kamikaze.`);
            } else {
              logEvent(state, `Enemy ${ec.rank || ec.value} of ${ec.suit.toUpperCase()}'s shield bubble absorbs Kamikaze damage and does not pop.`);
            }
          } else {
            ec.hp -= card.value;
            logEvent(state, `Enemy ${ec.rank || ec.value} of ${ec.suit.toUpperCase()} takes ${card.value} damage.`);
          }
          
          if (ec.hp <= 0) {
            oppState.board.splice(i, 1);
            state.defeated.push(ec);
            logEvent(state, `Enemy ${ec.suit.toUpperCase()} ${ec.rank || ec.value} defeated by Kamikaze!`);
          }
        }
      } else {
        // Power 2: Detonate (damage to single enemy card, stays on board)
        if (targetInfo) {
          const ecIdx = oppState.board.findIndex(c => c.id === targetInfo);
          if (ecIdx !== -1) {
            const ec = oppState.board[ecIdx];
            if (ec.shield) {
              const shieldThreshold = ec.hp;
              if (card.value >= shieldThreshold) {
                ec.shield = false;
                logEvent(state, `Enemy ${ec.rank || ec.value} of ${ec.suit.toUpperCase()}'s shield bubble POPPED by Detonate.`);
              } else {
                logEvent(state, `Enemy ${ec.rank || ec.value} of ${ec.suit.toUpperCase()}'s shield bubble absorbs Detonate damage and does not pop.`);
              }
            } else {
              ec.hp -= card.value;
              logEvent(state, `Detonate! Deals ${card.value} Clubs damage to enemy ${ec.rank || ec.value} of ${ec.suit.toUpperCase()}.`);
            }
            
            if (ec.hp <= 0) {
              oppState.board.splice(ecIdx, 1);
              state.defeated.push(ec);
              logEvent(state, `Enemy ${ec.suit.toUpperCase()} ${ec.rank || ec.value} defeated by Detonate!`);
            }
          }
        }
      }
    }
  });
  
  card.playedThisTurn = true; // summoning sickness
  if (shouldPlaceOnBoard) {
    pState.board.push(card);
  }
  
  update10CardBuff(pState);
  state.pendingPlay = null;
  checkBoardBarrierBuff(state, 'A');
  checkBoardBarrierBuff(state, 'B');
  return state;
}

// Elite Card Play Resolver
export function playEliteCard(state, cardId, chosenAbilityIndex, extraParams = null) {
  const active = state.activePlayer;
  const pState = state.players[active];
  
  const limit = getPlayLimit(pState.lp, pState.has10CardBuff);
  if (pState.cardsPlayedThisTurn >= limit) {
    logEvent(state, `Cannot play card. Exceeded play limit of ${limit} cards based on health!`);
    return state;
  }
  
  const cardIdx = pState.hand.findIndex(c => c.id === cardId);
  if (cardIdx === -1) return state;
  const card = pState.hand[cardIdx];
  
  pState.hand.splice(cardIdx, 1);
  pState.cardsPlayedThisTurn += 1;
  
  logEvent(state, `Plays ${card.rank} of ${card.suit.toUpperCase()}`);
  
  let shouldPlaceOnBoard = true;
  
  // Resolve Elite powers based on suit and rank
  resolveEliteAbility(state, active, card, card.suit, chosenAbilityIndex, extraParams, () => {
    // Callback: if card is Ace underlay or Board wiped, handle board status
    if (extraParams && extraParams.isUnderlay) {
      shouldPlaceOnBoard = false;
    }
  });
  
  card.playedThisTurn = true; // summoning sickness
  
  if (card.rank === 'A') {
    shouldPlaceOnBoard = false;
    state.defeated.push(card);
    logEvent(state, `Ace of ${card.suit.toUpperCase()} consumed and sent to Defeated Pile.`);
  }
  
  if (shouldPlaceOnBoard) {
    pState.board.push(card);
  }
  
  update10CardBuff(pState);
  state.pendingPlay = null;
  checkBoardBarrierBuff(state, 'A');
  checkBoardBarrierBuff(state, 'B');
  return state;
}

// Underlay resolution: Ace under active elite
export function playUnderlayAce(state, aceId, targetEliteId, chosenAbilityIndex, extraParams = null) {
  const active = state.activePlayer;
  const pState = state.players[active];
  
  const limit = getPlayLimit(pState.lp, pState.has10CardBuff);
  if (pState.cardsPlayedThisTurn >= limit) {
    logEvent(state, `Cannot play card. Exceeded play limit of ${limit} cards based on health!`);
    return state;
  }
  
  const aceIdx = pState.hand.findIndex(c => c.id === aceId);
  if (aceIdx === -1) return state;
  const ace = pState.hand[aceIdx];
  
  const targetElite = pState.board.find(c => c.id === targetEliteId);
  if (!targetElite || !targetElite.isElite) return state;
  
  if (targetElite.stunnedTurns > 0) {
    logEvent(state, `Cannot underlay Ace under a stunned Elite card!`);
    return state;
  }
  
  if (ace.suit === targetElite.suit) {
    logEvent(state, `Cannot underlay Ace of ${ace.suit.toUpperCase()} under Elite of the SAME suit!`);
    return state;
  }
  
  // Remove Ace from hand
  pState.hand.splice(aceIdx, 1);
  pState.cardsPlayedThisTurn += 1;
  pState.underlaysPlayedThisTurn += 1;
  
  // Attach Ace under Target Elite
  targetElite.underlays.push(ace);
  logEvent(state, `Underlays Ace of ${ace.suit.toUpperCase()} under Elite ${targetElite.rank} of ${targetElite.suit.toUpperCase()}`);
  
  // Prompt the user to select the underlaid suit power for this Elite card
  // Resolve it instantly based on the selected ability index
  resolveEliteAbility(state, active, targetElite, ace.suit, chosenAbilityIndex, extraParams, () => {});
  
  update10CardBuff(pState);
  checkBoardBarrierBuff(state, 'A');
  checkBoardBarrierBuff(state, 'B');
  return state;
}

// Inner helper to execute Elite Card abilities
function resolveEliteAbility(state, player, targetElite, suit, abilityIdx, extraParams, underlayCallback) {
  const opp = player === 'A' ? 'B' : 'A';
  const oppState = state.players[opp];
  const pState = state.players[player];
  const rank = targetElite.rank;
  
  if (suit === 'diamonds') {
    if (rank === 'J') {
      // Jack: [0] Haste & Draw 1, [1] Shield
      if (abilityIdx === 0) {
        targetElite.maxAttacks = 1;
        targetElite.attackedThisTurn = 0;
        targetElite.hasHaste = true;
        drawCard(state, player);
        logEvent(state, `${targetElite.rank} of ${targetElite.suit.toUpperCase()} draws 1 card and can attack immediately.`);
      } else {
        targetElite.shield = true;
        logEvent(state, `${targetElite.rank} of ${targetElite.suit.toUpperCase()} gains a protective shield bubble.`);
      }
     } else if (rank === 'Q') {
      // Queen: [0] Haste & Draw 2, [1] Shield
      if (abilityIdx === 0) {
        targetElite.maxAttacks = 1;
        targetElite.attackedThisTurn = 0;
        targetElite.hasHaste = true;
        drawCard(state, player);
        drawCard(state, player);
        logEvent(state, `${targetElite.rank} of ${targetElite.suit.toUpperCase()} draws 2 cards and can attack immediately.`);
      } else {
        targetElite.shield = true;
        logEvent(state, `${targetElite.rank} of ${targetElite.suit.toUpperCase()} gains a protective shield bubble.`);
      }
    } else if (rank === 'K') {
      // King: [0] Haste & Draw 3, [1] Shield
      if (abilityIdx === 0) {
        targetElite.maxAttacks = 1;
        targetElite.attackedThisTurn = 0;
        targetElite.hasHaste = true;
        drawCard(state, player);
        drawCard(state, player);
        drawCard(state, player);
        logEvent(state, `${targetElite.rank} of ${targetElite.suit.toUpperCase()} draws 3 cards and can attack immediately.`);
      } else {
        targetElite.shield = true;
        logEvent(state, `${targetElite.rank} of ${targetElite.suit.toUpperCase()} gains a protective shield bubble.`);
      }
    } else if (rank === 'A') {
      // Ace: [0] Underlay, [1] Both draw 4
      if (abilityIdx === 0) {
        underlayCallback(); // removes from board placing, marked as underlay
      } else {
        for (let i = 0; i < 4; i++) {
          drawCard(state, 'A');
          drawCard(state, 'B');
        }
        logEvent(state, "Ace of Diamonds triggers: Both players draw 4 cards!");
      }
    }
  } else if (suit === 'hearts') {
    if (rank === 'J' || rank === 'Q' || rank === 'K') {
      // Mind control limit: J <= 12, Q <= 13, K <= 14
      const limit = rank === 'J' ? 12 : rank === 'Q' ? 13 : 14;
      // [0] Mind Control, [1] Heal 12/13/14 AND Damage 12/13/14
      if (abilityIdx === 0) {
        if (extraParams && extraParams.targetId) {
          const ecIdx = oppState.board.findIndex(c => c.id === extraParams.targetId);
          if (ecIdx !== -1) {
            const enemyCard = oppState.board[ecIdx];
            if (enemyCard.atk <= limit) {
              if (enemyCard.shield) {
                enemyCard.shield = false;
                logEvent(state, `Mind Control on ${enemyCard.rank || enemyCard.value} of ${enemyCard.suit.toUpperCase()} is blocked by Shield! Shield is removed.`);
              } else {
                oppState.board.splice(ecIdx, 1);
                // Clean up tanks before joining new board (keep stun status)
                enemyCard.isTank = false;
                pState.board.push(enemyCard);
                logEvent(state, `MIND CONTROL! Steals enemy card ${enemyCard.rank || enemyCard.value} of ${enemyCard.suit.toUpperCase()}`);
              }
            }
          }
        }
      } else {
        const val = rank === 'J' ? 12 : rank === 'Q' ? 13 : 14;
        logEvent(state, `Hearts healing/damage: heals friendly by ${val}, damages opponent LP by ${val}.`);
        
        // Heal player LP
        healCharacter(state, player, 'player', val);
        // Heal friendly board
        pState.board.forEach(fc => {
          healCharacter(state, player, fc, val);
        });
        
        // Deal direct damage
        oppState.lp = Math.max(0, oppState.lp - val);
        if (oppState.lp <= 0) {
          state.winner = player;
          state.phase = 'GAME_OVER';
          logEvent(state, `${oppState.name} has fallen! Game Over.`);
        }
      }
    } else if (rank === 'A') {
      // Ace: [0] Underlay, [1] Both increase health by 50 LP
      if (abilityIdx === 0) {
        underlayCallback();
      } else {
        state.players['A'].maxLp = (state.players['A'].maxLp || 150) + 50;
        state.players['A'].lp += 50;
        state.players['B'].maxLp = (state.players['B'].maxLp || 150) + 50;
        state.players['B'].lp += 50;
        logEvent(state, "Ace of Hearts triggers: Both players' health is increased by 50 LP!");
      }
    }
  } else if (suit === 'spades') {
    if (rank === 'J' || rank === 'Q' || rank === 'K') {
      // [0] Tank & Stun for 1/2/3 turns, [1] Pick and Draw Elite card
      const turns = rank === 'J' ? 1 : rank === 'Q' ? 2 : 3;
      if (abilityIdx === 0) {
        targetElite.isTank = true;
        oppState.board.forEach(ec => {
          ec.stunnedTurns = (ec.stunnedTurns || 0) + turns;
        });
        logEvent(state, `${targetElite.rank} of SPADES becomes a Tank and STUNS all enemy board cards for ${turns} turns!`);
      } else {
        let chosenCardId = extraParams && extraParams.searchCardId;
        const allowedRanks = rank === 'J' ? ['A', 'J'] : rank === 'Q' ? ['A', 'J', 'Q'] : ['A', 'J', 'Q', 'K'];
        
        if (!chosenCardId) {
          // If no card ID is passed (e.g. AI is playing), automatically choose the best one from the deck or defeated
          const eligibleInDeck = pState.deck.filter(c => c.isElite && allowedRanks.includes(c.rank));
          if (eligibleInDeck.length > 0) {
            const rankOrder = { 'A': 4, 'K': 3, 'Q': 2, 'J': 1 };
            eligibleInDeck.sort((a, b) => (rankOrder[b.rank] || 0) - (rankOrder[a.rank] || 0));
            chosenCardId = eligibleInDeck[0].id;
          } else {
            const eligibleInDefeated = state.defeated.filter(c => c.isElite && allowedRanks.includes(c.rank));
            if (eligibleInDefeated.length > 0) {
              const rankOrder = { 'A': 4, 'K': 3, 'Q': 2, 'J': 1 };
              eligibleInDefeated.sort((a, b) => (rankOrder[b.rank] || 0) - (rankOrder[a.rank] || 0));
              chosenCardId = eligibleInDefeated[0].id;
            }
          }
        }
        
        if (chosenCardId) {
          const deckIdx = pState.deck.findIndex(c => c.id === chosenCardId);
          if (deckIdx !== -1) {
            const cardToDraw = pState.deck[deckIdx];
            pState.deck.splice(deckIdx, 1);
            pState.hand.push(cardToDraw);
            logEvent(state, `${pState.name} searches deck and draws an Elite card.`);
            update10CardBuff(pState);
          } else {
            let defIdx = state.defeated.findIndex(c => c.id === chosenCardId);

            if (defIdx !== -1) {
              const cardToDraw = state.defeated[defIdx];
              state.defeated.splice(defIdx, 1);
              
              // Reset stats when drawing back
              cardToDraw.atk = cardToDraw.baseAtk;
              cardToDraw.hp = cardToDraw.baseHp;
              cardToDraw.maxHp = cardToDraw.baseHp;
              cardToDraw.shield = false;
              cardToDraw.isTank = false;
              cardToDraw.stunnedTurns = 0;
              cardToDraw.underlays = [];
              cardToDraw.attackedThisTurn = 0;
              cardToDraw.hasHaste = false;
              
              pState.hand.push(cardToDraw);
              
              // Take fatigue damage
              state.defeatedDrawsCount[player] += 1;
              const fatigueDamage = state.defeatedDrawsCount[player];
              pState.lp = Math.max(0, pState.lp - fatigueDamage);
              
              logEvent(state, `${pState.name} searches DEFEATED pile and draws an Elite card, taking ${fatigueDamage} fatigue damage!`);
              update10CardBuff(pState);
              
              if (pState.lp <= 0) {
                state.winner = player === 'A' ? 'B' : 'A';
                state.phase = 'GAME_OVER';
                logEvent(state, `${pState.name} died to fatigue damage. Game Over!`);
              }
            }
          }
        } else {
          logEvent(state, `${pState.name} searches but finds no eligible Elite cards.`);
        }
      }
    } else if (rank === 'A') {
      // Ace: [0] Underlay, [1] Stun entire board for 4 turns
      if (abilityIdx === 0) {
        underlayCallback();
      } else {
        pState.board.forEach(c => { c.stunnedTurns = (c.stunnedTurns || 0) + 4; });
        oppState.board.forEach(c => { c.stunnedTurns = (c.stunnedTurns || 0) + 4; });
        logEvent(state, "Ace of Spades triggers: Entire board (all cards) is STUNNED for 4 turns!");
      }
    }
  } else if (suit === 'clubs') {
    if (rank === 'J' || rank === 'Q' || rank === 'K') {
      // [0] Deal 12/13/14 damage to all enemy board cards (no self-defeat)
      // [1] Summon 2/3/4 defeated normal Clubs cards (< 12/13/14 value)
      const dmg = rank === 'J' ? 12 : rank === 'Q' ? 13 : 14;
      const count = rank === 'J' ? 2 : rank === 'Q' ? 3 : 4;
      if (abilityIdx === 0) {
        logEvent(state, `Elite Clubs damage: Deals ${dmg} damage to all enemy board cards.`);
        for (let i = oppState.board.length - 1; i >= 0; i--) {
          const ec = oppState.board[i];
          if (ec.shield) {
            const shieldThreshold = ec.hp;
            if (dmg >= shieldThreshold) {
              ec.shield = false;
              logEvent(state, `Enemy ${ec.rank || ec.value} of ${ec.suit.toUpperCase()}'s shield bubble POPPED by Elite Clubs damage.`);
            } else {
              logEvent(state, `Enemy ${ec.rank || ec.value} of ${ec.suit.toUpperCase()}'s shield bubble absorbs Elite Clubs damage and does not pop.`);
            }
          } else {
            ec.hp -= dmg;
            logEvent(state, `Enemy ${ec.rank || ec.value} of ${ec.suit.toUpperCase()} takes ${dmg} damage.`);
          }
          
          if (ec.hp <= 0) {
            oppState.board.splice(i, 1);
            state.defeated.push(ec);
            logEvent(state, `Enemy ${ec.suit.toUpperCase()} ${ec.rank || ec.value} defeated by Elite Clubs!`);
          }
        }
      } else if (abilityIdx === 1) {
        // Summon defeated normal Clubs from both players
        const allDefeated = state.defeated.map(c => ({ card: c }));
        
        const eligible = allDefeated
          .filter(entry => entry.card.suit === 'clubs' && !entry.card.isElite && entry.card.value < dmg)
          .sort((a, b) => b.card.value - a.card.value);
        
        let summoned = 0;
        for (let i = 0; i < count; i++) {
          if (eligible.length > summoned) {
            const { card: resCard } = eligible[summoned++];
            const idx = state.defeated.findIndex(c => c.id === resCard.id);
            if (idx !== -1) {
              state.defeated.splice(idx, 1);
              
              // Elites summoning normal clubs keep base stats (strictly less than dmg condition, already normal)
              resCard.atk = resCard.baseAtk;
              resCard.hp = resCard.baseHp;
              resCard.maxHp = resCard.baseHp;
              resCard.shield = false;
              resCard.isTank = false;
              resCard.stunnedTurns = 0;
              resCard.underlays = [];
              resCard.playedThisTurn = true; // summoning sickness
              resCard.attackedThisTurn = 0;
              resCard.hasHaste = false;
              
              pState.board.push(resCard);
              logEvent(state, `Summons defeated Clubs: ${resCard.suit.toUpperCase()} ${resCard.value} to board.`);
            }
          }
        }
      }
    } else if (rank === 'A') {
      // Ace: [0] Underlay, [1] Board Wipe
      if (abilityIdx === 0) {
        underlayCallback();
      } else {
        // Move all board cards to defeated piles
        for (let i = pState.board.length - 1; i >= 0; i--) {
          state.defeated.push(pState.board[i]);
        }
        pState.board = [];
        
        for (let i = oppState.board.length - 1; i >= 0; i--) {
          state.defeated.push(oppState.board[i]);
        }
        oppState.board = [];
        
        logEvent(state, "Ace of Clubs triggers: BOARD WIPE! All board cards sent to Defeated Piles.");
      }
    }
  }
}

// Combat Execution
export function executeCombat(state, attackerId, defenderId) {
  const active = state.activePlayer;
  const pState = state.players[active];
  const opp = active === 'A' ? 'B' : 'A';
  const oppState = state.players[opp];
  
  const attacker = pState.board.find(c => c.id === attackerId);
  const defender = oppState.board.find(c => c.id === defenderId);
  
  if (!attacker || !defender) return state;
  
  if (!canCardAttack(attacker)) {
    logEvent(state, `Attacker is not able to attack! (Stunned, Summoning Sickness, or Max Attacks reached)`);
    return state;
  }
  
  // Force Spades Tank attacking rule
  const tanksOnOppBoard = oppState.board.filter(c => c.isTank && !(c.stunnedTurns > 0));
  if (tanksOnOppBoard.length > 0 && !defender.isTank) {
    logEvent(state, `You must attack the enemy Spades Tank first!`);
    return state;
  }
  
  attacker.attackedThisTurn += 1;
  logEvent(state, `${attacker.rank || attacker.value} of ${attacker.suit.toUpperCase()} attacks ${defender.rank || defender.value} of ${defender.suit.toUpperCase()}`);
  
  // Combat math:
  let attackerDmgDealt = attacker.atk;
  let defenderDmgDealt = (defender.stunnedTurns > 0) ? 0 : defender.atk;
  
  const defenderPrevHp = defender.hp;
  const attackerPrevHp = attacker.hp;
  
  // 1. Resolve damage to defender (with shield check)
  let actualDmgToDefender = 0;
  if (defender.shield) {
    const threshold = defender.hp;
    if (attackerDmgDealt >= threshold) {
      defender.shield = false;
      logEvent(state, `Defender shield pops! Absorbed all ${attackerDmgDealt} damage.`);
    } else {
      logEvent(state, `Defender shield absorbs all ${attackerDmgDealt} damage and does not pop.`);
    }
    attackerDmgDealt = 0;
  } else {
    defender.hp -= attackerDmgDealt;
    actualDmgToDefender = attackerDmgDealt;
  }
  
  // 2. Resolve damage to attacker (with shield check)
  let actualDmgToAttacker = 0;
  if (attacker.shield) {
    const threshold = attacker.hp;
    if (defenderDmgDealt >= threshold) {
      attacker.shield = false;
      logEvent(state, `Attacker shield pops! Absorbed all ${defenderDmgDealt} damage.`);
    } else {
      logEvent(state, `Attacker shield absorbs all ${defenderDmgDealt} damage and does not pop.`);
    }
    defenderDmgDealt = 0;
  } else {
    attacker.hp -= defenderDmgDealt;
    actualDmgToAttacker = defenderDmgDealt;
  }
  
  // 3. Excess damage to player LP:
  if (attacker.atk >= defender.atk) {
    if (actualDmgToDefender > defenderPrevHp) {
      const excess = actualDmgToDefender - Math.max(0, defenderPrevHp);
      oppState.lp = Math.max(0, oppState.lp - excess);
      logEvent(state, `Excess damage: ${excess} damage dealt directly to defending player's LP! (Opponent LP: ${oppState.lp})`);
      
      if (oppState.lp <= 0) {
        state.winner = active;
        state.phase = 'GAME_OVER';
        logEvent(state, `${oppState.name} has fallen! Game Over.`);
        return state;
      }
    }
  } else {
    if (actualDmgToAttacker > attackerPrevHp) {
      const excess = actualDmgToAttacker - Math.max(0, attackerPrevHp);
      pState.lp = Math.max(0, pState.lp - excess);
      logEvent(state, `Excess damage: ${excess} damage dealt directly to active player's LP! (Player LP: ${pState.lp})`);
      
      if (pState.lp <= 0) {
        state.winner = opp;
        state.phase = 'GAME_OVER';
        logEvent(state, `${pState.name} has fallen! Game Over.`);
        return state;
      }
    }
  }
  
  // Check deaths
  const attackerDefeated = attacker.hp <= 0;
  const defenderDefeated = defender.hp <= 0;
  
  if (defenderDefeated) {
    const idx = oppState.board.findIndex(c => c.id === defender.id);
    if (idx !== -1) {
      oppState.board.splice(idx, 1);
    }
    state.defeated.push(defender);
    logEvent(state, `Defender ${defender.suit.toUpperCase()} ${defender.rank || defender.value} is defeated!`);
  }
  
  if (attackerDefeated) {
    const idx = pState.board.findIndex(c => c.id === attacker.id);
    if (idx !== -1) {
      pState.board.splice(idx, 1);
    }
    state.defeated.push(attacker);
    logEvent(state, `Attacker ${attacker.suit.toUpperCase()} ${attacker.rank || attacker.value} is defeated!`);
  }
  
  checkBoardBarrierBuff(state, 'A');
  checkBoardBarrierBuff(state, 'B');
  return state;
}

// Attack Player Direct (if opponent has no board cards and no tanks)
export function executeAttackPlayer(state, attackerId) {
  const active = state.activePlayer;
  const pState = state.players[active];
  const opp = active === 'A' ? 'B' : 'A';
  const oppState = state.players[opp];
  
  const attacker = pState.board.find(c => c.id === attackerId);
  if (!attacker) return state;
  
  if (!canCardAttack(attacker)) {
    logEvent(state, `Attacker is not able to attack! (Stunned, Summoning Sickness, or Max Attacks reached)`);
    return state;
  }
  
  // Can only attack direct if opponent has no Spades Tanks on board
  if (oppState.board.some(c => c.isTank && !(c.stunnedTurns > 0))) {
    logEvent(state, `Cannot attack opponent LP direct while they have Spades Tanks on board!`);
    return state;
  }
  
  attacker.attackedThisTurn += 1;
  oppState.lp = Math.max(0, oppState.lp - attacker.atk);
  logEvent(state, `${attacker.rank || attacker.value} of ${attacker.suit.toUpperCase()} attacks opponent directly for ${attacker.atk} damage! (Opponent LP: ${oppState.lp})`);
  
  if (oppState.lp <= 0) {
    state.winner = active;
    state.phase = 'GAME_OVER';
    logEvent(state, `${oppState.name} has fallen! Game Over.`);
  }
  
  return state;
}
