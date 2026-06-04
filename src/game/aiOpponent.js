import { playNormalCard, playEliteCard, playUnderlayAce, executeCombat, executeAttackPlayer, healCharacter, endTurn, getPlayLimit, canCardAttack } from './gameEngine.js';

// Main AI trigger called during the gameplay loop when it is B's turn
export function runAiGameplayTurn(state, updateStateCallback) {
  if (state.phase !== 'GAMEPLAY' || state.activePlayer !== 'B') return;

  // We perform actions sequentially with small delays or synchronously in one turn batch
  // For standard React, doing it in steps or a single function that executes multiple plays is fine.
  // To make it look like the AI is "thinking", we can run this function, which performs one logical action,
  // updates the state, and if it did something, we return so the coordinator can re-trigger it.
  // If no action is left, it ends its turn.

  let currentState = { ...state };
  const pB = currentState.players.B;
  const pA = currentState.players.A;

  // 1. Play Cards from Hand
  const playLimit = getPlayLimit(pB.lp, pB.has10CardBuff);
  if (pB.cardsPlayedThisTurn < playLimit && pB.hand.length > 0) {
    // Find a playable card
    // Prioritize Elites, then normal cards
    const eliteCard = pB.hand.find(c => c.isElite);
    if (eliteCard) {
      const resultState = playAiElite(currentState, eliteCard);
      if (resultState) {
        updateStateCallback(resultState);
        return; // Action taken, let state update
      }
    }

    const normalCard = pB.hand.find(c => !c.isElite);
    if (normalCard) {
      const resultState = playAiNormal(currentState, normalCard);
      if (resultState) {
        updateStateCallback(resultState);
        return; // Action taken, let state update
      }
    }
  }

  // 2. Perform Attacks with board cards
  const attackingCard = pB.board.find(c => {
    return canCardAttack(c);
  });

  if (attackingCard) {
    // We have a card that can attack!
    const defender = chooseAiAttackTarget(currentState, attackingCard);
    if (defender === 'player') {
      const nextState = executeAttackPlayer(currentState, attackingCard.id);
      updateStateCallback(nextState);
      return;
    } else if (defender) {
      const nextState = executeCombat(currentState, attackingCard.id, defender.id);
      updateStateCallback(nextState);
      return;
    }
  }

  // 3. No actions left - End Turn!
  // To prevent infinite loops, we make sure we don't end turn if it's already ended.
  if (currentState.activePlayer === 'B') {
    const nextState = { ...currentState };
    const finalState = endTurn(nextState);
    updateStateCallback(finalState);
  }
}

// AI decision to play an Elite card
function playAiElite(state, card) {
  const oppState = state.players.A;
  const pB = state.players.B;
  
  // Decide ability index and target
  let abilityIdx = 0;
  let extraParams = null;

  if (card.suit === 'diamonds') {
    // Attack multiple times is usually the best choice for J, Q, K
    abilityIdx = 0;
    if (card.rank === 'A') {
      // Ace of Diamonds: underlay if we have another active Elite, otherwise draw 5
      const activeElite = pB.board.find(c => c.isElite && c.id !== card.id);
      if (activeElite) {
        abilityIdx = 0; // underlay
        extraParams = { isUnderlay: true };
      } else {
        abilityIdx = 1; // draw 5
      }
    }
  } else if (card.suit === 'hearts') {
    if (card.rank === 'A') {
      // Ace of Hearts: restore 50 LP
      abilityIdx = 1;
    } else {
      // J, Q, K: Check if we can mind control a strong enemy card
      const limit = card.rank === 'J' ? 11 : card.rank === 'Q' ? 12 : 13;
      const targetCard = oppState.board
        .filter(c => c.atk <= limit)
        .sort((a, b) => b.atk - a.atk)[0]; // strongest eligible
      
      if (targetCard) {
        abilityIdx = 0; // Mind control
        extraParams = { targetId: targetCard.id };
      } else {
        abilityIdx = 1; // Heal / Damage
      }
    }
  } else if (card.suit === 'spades') {
    if (card.rank === 'A') {
      abilityIdx = 1; // Stun entire board (4 turns)
    } else {
      // Prefer Tank & Stun if opponent has board cards, else Shield
      if (oppState.board.length > 0) {
        abilityIdx = 0;
      } else {
        abilityIdx = 1;
      }
    }
  } else if (card.suit === 'clubs') {
    if (card.rank === 'A') {
      // Ace of Clubs: Wipe board if player has more cards, else underlay/discard
      if (oppState.board.length > pB.board.length + 1) {
        abilityIdx = 1; // Board Wipe
      } else {
        const activeElite = pB.board.find(c => c.isElite && c.id !== card.id);
        if (activeElite) {
          abilityIdx = 0; // Underlay
          extraParams = { isUnderlay: true };
        } else {
          abilityIdx = 1; // Wipe anyway if nothing else
        }
      }
    } else {
      // J, Q, K: Detonate if opponent board has multiple cards, else resurrect Clubs
      const dmg = card.rank === 'J' ? 12 : card.rank === 'Q' ? 13 : 14;
      const defeatedClubs = pB.defeated.filter(c => c.suit === 'clubs' && c.value < dmg);
      
      if (oppState.board.length >= 2) {
        abilityIdx = 0; // Deal damage to all
      } else if (defeatedClubs.length > 0) {
        abilityIdx = 1; // Resurrect normal clubs
      } else {
        abilityIdx = 0; // default to damage
      }
    }
  }

  // Handle underlay play specifically
  if (card.rank === 'A' && abilityIdx === 0) {
    const targetElite = pB.board.find(c => c.isElite && c.id !== card.id && c.suit !== card.suit);
    if (targetElite) {
      // Choose index 0 of underlaid Ace suit for simplicity for the target card
      return playUnderlayAce(state, card.id, targetElite.id, 0);
    } else {
      // Fallback to action effect if no valid same-suit-restricted target exists
      abilityIdx = 1;
    }
  }

  return playEliteCard(state, card.id, abilityIdx, extraParams);
}

// AI decision to play a Normal card
function playAiNormal(state, card) {
  const oppState = state.players.A;
  const pB = state.players.B;

  if (pB.has10CardBuff) {
    // Both powers run automatically, no powerIndex needed.
    // Just select a target if required
    let target = null;
    if (card.suit === 'hearts') {
      target = pB.board.length > 0 ? pB.board[0].id : 'player';
    } else if (card.suit === 'spades' || card.suit === 'clubs') {
      target = oppState.board.length > 0 ? oppState.board[0].id : null;
    }
    return playNormalCard(state, card.id, 0, target);
  }

  let powerIdx = 0; // 0 is Power 1, 1 is Power 2
  let targetInfo = null;

  if (card.suit === 'diamonds') {
    // Draw 1 if hand is small, else Charge/Strike
    if (pB.hand.length <= 4) {
      powerIdx = 0; // Draw
    } else {
      powerIdx = 1; // Haste
    }
  } else if (card.suit === 'hearts') {
    // Heal friendly if damaged, else damage opponent LP
    const damagedCard = pB.board.find(c => c.hp < c.maxHp);
    if (damagedCard) {
      powerIdx = 0;
      targetInfo = damagedCard.id;
    } else if (pB.lp < 80) {
      powerIdx = 0;
      targetInfo = 'player';
    } else {
      powerIdx = 1; // direct damage
    }
  } else if (card.suit === 'spades') {
    // Stun if opponent has cards on board, else Tank
    if (oppState.board.length > 0) {
      powerIdx = 1; // Power 2 (Stun)
      // Target the strongest opponent board card
      const targetCard = [...oppState.board].sort((a, b) => b.atk - a.atk)[0];
      targetInfo = targetCard.id;
    } else {
      powerIdx = 0; // Power 1 (Tank)
    }
  } else if (card.suit === 'clubs') {
    // Scythe Sweep if crowded, else Shield Strike
    if (oppState.board.length >= 2) {
      powerIdx = 0; // Power 1 (Scythe Sweep)
    } else if (oppState.board.length === 1) {
      powerIdx = 1; // Power 2 (Shield Strike)
      targetInfo = oppState.board[0].id;
    } else {
      powerIdx = 1; // Power 2 (Shield Strike) fallback
    }
  }

  return playNormalCard(state, card.id, powerIdx, targetInfo);
}

// AI decision to attack which card
function chooseAiAttackTarget(state, attacker) {
  const oppState = state.players.A;

  if (oppState.board.length === 0) {
    return 'player'; // Attack directly
  }

  // Force Spades Tank attacking rule
  const tanks = oppState.board.filter(c => c.isTank);
  if (tanks.length > 0) {
    // Must attack tank! Choose the tank with lowest HP or highest threat
    return tanks.sort((a, b) => a.hp - b.hp)[0];
  }

  // Otherwise, choose best target:
  // Can we defeat an enemy card?
  const defeatable = oppState.board.filter(c => c.hp <= attacker.atk);
  if (defeatable.length > 0) {
    // Yes! Attack the strongest defeatable card to deal excess damage to player LP!
    return defeatable.sort((a, b) => b.atk - a.atk)[0];
  }

  // Else, just attack the strongest enemy card that has lower attack than our attacker,
  // or attack player directly? Wait, you cannot attack player directly if they have board cards!
  // "Can only attack direct if opponent has no board cards."
  // So we must attack a board card. Let's attack the one that will deal minimal retaliation,
  // or a high threat card. Let's pick the one with lowest ATK.
  return oppState.board.sort((a, b) => a.atk - b.atk)[0];
}

// AI draft helper: selects a subsection
export function getAiNormalDraftChoice(state) {
  const available = state.draft.availableSubsections;
  if (available.length === 0) return null;
  
  // Choose subsection with highest number of cards or clubs/spades
  // Even subsections have 5 cards [2,4,6,8,10], Odd have 4 [3,5,7,9]
  // Let's choose Even first to get more cards!
  const evens = available.filter(s => s.type === 'even');
  if (evens.length > 0) {
    return evens[Math.floor(Math.random() * evens.length)].id;
  }
  return available[Math.floor(Math.random() * available.length)].id;
}

// AI elite draft helper: selects an Elite card
export function getAiEliteDraftChoice(state) {
  const available = state.draft.availableElites;
  const category = state.draft.currentEliteCategory;
  
  if (category === null) {
    // Dynamic category select state: AI is starting a new category draft round
    // Prioritize choosing a Spade or Heart card to get good defensive/steal cards
    const preferred = available.find(c => c.suit === 'spades') || 
                      available.find(c => c.suit === 'hearts') || 
                      available[0];
    return preferred ? preferred.id : null;
  }
  
  const eligible = available.filter(c => c.rank === category);
  if (eligible.length === 0) return null;
  
  // Prefer Spades (for tanks/shields) or Hearts (for mind control), or just random
  const spades = eligible.find(c => c.suit === 'spades');
  if (spades) return spades.id;
  
  const hearts = eligible.find(c => c.suit === 'hearts');
  if (hearts) return hearts.id;
  
  return eligible[Math.floor(Math.random() * eligible.length)].id;
}
