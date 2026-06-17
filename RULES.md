# 🃏 MORLD — Lit Elite: Official Rule Book

> *"In the world of Lit Elite, every card is a weapon, every play is a gamble, and every turn could be your last."*

---

## Table of Contents

1. [Game Overview](#1-game-overview)
2. [Card Types](#2-card-types)
3. [Draft Phase](#3-draft-phase)
4. [Deck Building](#4-deck-building)
5. [Turn Structure](#5-turn-structure)
6. [Play Limits](#6-play-limits)
7. [Normal Card Powers](#7-normal-card-powers)
8. [Summoning Sickness](#8-summoning-sickness)
9. [Elite Card Abilities](#9-elite-card-abilities)
10. [Ace Underlay System](#10-ace-underlay-system)
11. [Combat](#11-combat)
12. [Special Mechanics](#12-special-mechanics)
13. [Forbidden Turn Restrictions](#13-forbidden-turn-restrictions)
14. [Victory Conditions](#14-victory-conditions)
15. [Defeated Pile](#15-defeated-pile)
16. [Quick Reference Tables](#16-quick-reference-tables)

---

## 1. Game Overview

**Morld — Lit Elite** is a strategic 1v1 card battle game where two players clash in a battle of wits, timing, and card mastery. Your goal is simple: **reduce your opponent's Life Points (LP) to zero**.

### Key Facts

| Parameter | Value |
|---|---|
| Players | 2 (1v1) |
| Starting LP | 150 |
| Maximum LP | 150 (can be increased via Heart Ace) |
| Total Cards in Game | 52 (36 Normal + 16 Elite) |
| Cards per Deck (post-draft) | 26 |
| Initial Hand Size | 6 |

### Game Modes

- **Hotseat** — Pass & Play on a single device. Players alternate viewing the screen.
- **vs AI** — Battle against a computer-controlled opponent.
- **Online Multiplayer** — Challenge a remote player via real-time connection.

---

## 2. Card Types

### 2.1 Normal Cards (36 total)

Normal cards form the backbone of your army. There are **4 suits** (♦ Diamonds, ♥ Hearts, ♠ Spades, ♣ Clubs) × **9 values** (2, 3, 4, 5, 6, 7, 8, 9, 10) = **36 Normal cards**.

**Stats:** A Normal card's ATK (Attack), HP (Health Points), and MaxHP all equal its **face value**.

| Stat | Value |
|---|---|
| ATK | Card value (2–10) |
| HP | Card value (2–10) |
| MaxHP | Card value (2–10) |

**Default Properties:**
| Property | Default |
|---|---|
| `shield` | `false` |
| `isTank` | `false` |
| `stunnedTurns` | `0` |
| `underlays` | `[]` (empty) |
| `attackedThisTurn` | `0` |
| `maxAttacks` | `1` |
| `hasHaste` | `false` |
| `playedThisTurn` | `false` |

> **Example:** The ♥5 (Five of Hearts) has ATK 5, HP 5, MaxHP 5. It starts with no shield, is not a tank, is not stunned, and has no underlays.

### 2.2 Elite Cards (16 total)

Elite cards are the powerhouses — 4 suits × 4 ranks (Jack, Queen, King, Ace) = **16 Elite cards**.

| Rank | Symbol | ATK / HP |
|---|---|---|
| Jack | J | 12 / 12 |
| Queen | Q | 13 / 13 |
| King | K | 14 / 14 |
| Ace | A | 0 / 0 (special support card) |

> **Note:** Aces have 0 ATK and 0 HP. They are NOT placed on the board as fighters. Instead, they serve as powerful support cards with unique abilities (see [Ace Underlay System](#10-ace-underlay-system)).

---

## 3. Draft Phase

Before the game begins, both players participate in a **Draft Phase** to build their decks. The draft ensures no two games feel the same.

### 3.1 Normal Draft (4 Rounds)

The 36 Normal cards are organized into **8 subsections** — one for each combination of suit × parity:

| Subsection | Cards |
|---|---|
| ♦ Diamonds Odd | 3, 5, 7, 9 |
| ♦ Diamonds Even | 2, 4, 6, 8, 10 |
| ♥ Hearts Odd | 3, 5, 7, 9 |
| ♥ Hearts Even | 2, 4, 6, 8, 10 |
| ♠ Spades Odd | 3, 5, 7, 9 |
| ♠ Spades Even | 2, 4, 6, 8, 10 |
| ♣ Clubs Odd | 3, 5, 7, 9 |
| ♣ Clubs Even | 2, 4, 6, 8, 10 |

**Each round follows this pattern:**

1. **First player** picks **1 subsection** from available subsections
2. **Second player** picks **2 subsections** from remaining subsections
3. The **last remaining subsection** is automatically assigned to the **first player**

This means each round drafts exactly **4 subsections** (2 per player). Over 4 rounds, all 8 subsections are distributed — **4 subsections per player, 18 normal cards each**.

> **Important:** The starting drafter **alternates** each round. If Player A picks first in Round 1, Player B picks first in Round 2, and so on.

> **Example:**
> - **Round 1:** Player A picks ♠ Spades Odd [3,5,7,9]. Player B picks ♦ Diamonds Even [2,4,6,8,10] and ♣ Clubs Odd [3,5,7,9]. The remaining ♥ Hearts Even [2,4,6,8,10] goes to Player A automatically.
> - **Round 2:** Player B picks first this time...

### 3.2 Elite Draft (4 Rounds)

The 16 Elite cards are drafted by **rank category** (Jacks, Queens, Kings, Aces). Each round drafts all 4 suits of one rank.

**Each round:**

1. The **Category Selector** picks **any one Elite card** from the available ones in that rank — this also decides which rank category is being drafted this round.
2. The **opponent** then drafts **2 cards** from the remaining 3 in that category.
3. The **last remaining card** is auto-assigned to the selector.

> The **Selector role swaps** each round.

> **Example — Elite Draft Round 1:**
> - Player A (selector) picks ♠ Jack → this triggers the Jack category draft
> - Player B picks ♦ Jack and ♣ Jack
> - ♥ Jack auto-assigned to Player A
> - Result: Player A has ♠J and ♥J. Player B has ♦J and ♣J.

### 3.3 Final Elite Selection

After the Elite Draft, each player holds **8 drafted Elites** (2 of each rank). Each player must now choose exactly **4 Elites to keep** — one of each rank:

- 1 Jack (J)
- 1 Queen (Q)
- 1 King (K)
- 1 Ace (A)

The other 4 are discarded.

> **Example:** Player A drafted ♠J, ♥J, ♦Q, ♣Q, ♠K, ♥K, ♦A, ♣A. They must pick one J, one Q, one K, and one A. They might choose: ♠J, ♦Q, ♥K, ♣A.

---

## 4. Deck Building

After the draft and Elite selection, each player's deck is assembled automatically.

### Deck Composition

| Component | Count |
|---|---|
| Normal cards (from draft) | 18 |
| Elite cards (chosen) | 4 |
| **Total** | **22** |

Wait — the deck actually contains **26 cards** structured as follows:

### Deck Structure

1. **Top 6 cards:** Shuffled Normal cards (these become your initial hand)
2. **Remaining 20 cards:** Arranged in a repeating pattern (×4 iterations):
   - Normal, Normal, **Elite**, Normal, **Elite**

The initial draw of 6 guarantees you start with Normal cards only — no Elites in your opening hand.

> **Note:** The total deck is 26 cards: 6 top normals + (4 × 5 patterned cards) = 6 + 20 = 26.

---

## 5. Turn Structure

Each turn follows a strict sequence:

### Phase 1: Start of Turn
- Reset the active player's "cards played this turn" counter to 0
- Reset all board card attack stats (`attackedThisTurn = 0`)
- Reset `playedThisTurn = false` for all friendly board cards
- **Draw 1 card** from deck (unless the [10-Card Hand Buff](#121-10-card-hand-buff) is active — then drawing is **FROZEN**)

### Phase 2: Action Phase
During your action phase you may (in any order):
- **Play cards** from hand to board (limited by [Play Limits](#6-play-limits))
- **Attack** with board cards that are eligible
- **Use abilities** (card powers, underlays, etc.)

### Phase 3: End of Turn
- **Reset all board card HP** to their base MaxHP values
- **Decrement stun counters** on all stunned cards (both sides)
- Check [10-Card Buff](#121-10-card-hand-buff) deactivation: if hand has ≤ 6 cards, deactivate
- Switch active player
- Increment turn count

> **Example Turn Flow:**
> 1. You start your turn. Counter resets. You draw 1 card (now 7 in hand).
> 2. You play a ♥7 with Feed (Heal) power on your ♠5 board card (HP goes from 5→12 temporarily).
> 3. Your ♠5 (now 12 HP) attacks an enemy ♦4. Enemy ♦4 is destroyed.
> 4. You end your turn. Your ♠5's HP resets back to 5.

---

## 6. Play Limits

The number of cards you can play per turn depends on your current LP:

| LP Range | Cards per Turn |
|---|---|
| LP > 100 | 1 card |
| LP 51–100 | 2 cards |
| LP ≤ 50 | 3 cards |
| 10-Card Hand Buff active | 3 cards (overrides) |

> **Design Note:** As you take damage and your LP drops, you gain the ability to play more cards per turn — a comeback mechanic that keeps games competitive!

> **Example:** You have 85 LP. You can play 2 cards this turn. Your opponent plays a Sap for 7 damage, bringing you to 78 LP. Next turn, you still play 2 cards (78 is in the 51–100 range). But if you drop to 50 LP, you'll be able to play 3 cards per turn!

---

## 7. Normal Card Powers

When you play a Normal card from your hand, you must choose **one** of its two suit powers to activate. (Exception: if the [10-Card Hand Buff](#121-10-card-hand-buff) is active, **BOTH** powers activate!)

### 7.1 ♦ Diamonds — Resource Generation

| Power | Name | Effect |
|---|---|---|
| Power 1 | **Recruit** | Draw 1 card from your deck |
| Power 2 | **Berserk (Haste)** | This card can attack the same turn it is played (ignores Summoning Sickness) |

> **Example — Recruit:** You play ♦6 with Power 1. The ♦6 is placed on your board (ATK 6, HP 6), and you draw 1 card from your deck.

> **Example — Berserk:** You play ♦8 with Power 2. The ♦8 is placed on your board with Haste — it can immediately attack an enemy card or the opponent's LP this turn.

### 7.2 ♥ Hearts — Healing & Direct Damage

| Power | Name | Effect |
|---|---|---|
| Power 1 | **Feed (Heal)** | Heal amount = card's value. Target: player LP or a friendly board card. **Overheal:** if healing LP exceeds maxLP, the excess becomes damage to the opponent! When healing a board card, both HP and MaxHP increase temporarily (resets at end of turn). |
| Power 2 | **Sap** | Deal the card's value as **direct LP damage** to the opponent. Can kill! |

> **Example — Feed (LP Heal):** You have 145 LP (maxLP = 150). You play ♥8 with Feed targeting yourself. You heal 8, but LP caps at 150 (only 5 healed). The **excess 3 damage** is dealt to your opponent! This is the **Overheal** mechanic.

> **Example — Feed (Board Heal):** Your ♠5 on board has taken damage (HP = 2/5). You play ♥6 with Feed targeting the ♠5. The ♠5's HP becomes 2+6=8, and MaxHP temporarily becomes 5+6=11. At end of turn, HP resets to 5 (base MaxHP).

> **Example — Sap:** You play ♥10 with Sap. Your opponent takes 10 direct LP damage. If they have 8 LP remaining, they die!

### 7.3 ♠ Spades — Defense & Control

| Power | Name | Effect |
|---|---|---|
| Power 1 | **Bulwark (Tank)** | This card becomes a **Tank**. Enemies MUST attack Tanks before they can attack other board cards or the player directly. Multiple Tanks can coexist. |
| Power 2 | **Knock Out (Stun)** | Stun 1 enemy **Normal** card for 1 turn. Cannot stun Elite cards! Stunned cards cannot attack and deal 0 damage when attacked into. |

> **Example — Bulwark:** You play ♠9 with Bulwark. The ♠9 becomes a Tank (ATK 9, HP 9, Tank status). Your opponent must attack it before they can touch your other board cards or your LP.

> **Example — Knock Out:** You play ♠3 with Knock Out targeting enemy ♦7. The ♦7 is stunned for 1 turn — it cannot attack and deals 0 counter-damage if attacked.

### 7.4 ♣ Clubs — Destruction

| Power | Name | Effect |
|---|---|---|
| Power 1 | **Kamikaze (AOE)** | Deal this card's value as damage to **ALL** enemy board cards. The card **self-destructs** — it goes directly to the Defeated Pile without ever being placed on the board. |
| Power 2 | **Detonate (Single-target)** | Deal this card's value as damage to **one** enemy board card. The card IS placed on the board. |

**Shield Interaction for both powers:**
- If damage ≥ defender's HP → Shield **pops** (is removed) and absorbs all damage. Card survives with current HP.
- If damage < defender's HP → Shield absorbs the damage without popping.

> **Example — Kamikaze:** You play ♣7 with Kamikaze. Enemy board has ♦3 (3 HP), ♠5 (5 HP), and ♥8 (8 HP). All three take 7 damage. ♦3 is destroyed (7 > 3). ♠5 is destroyed (7 > 5). ♥8 survives with 1 HP (8 - 7 = 1). The ♣7 goes to the Defeated Pile.

> **Example — Kamikaze vs Shield:** Enemy ♠4 has Shield and 4 HP. Your ♣7 Kamikaze deals 7 damage. Since 7 ≥ 4 (HP), the shield POPS — absorbed! ♠4 keeps its 4 HP. If instead the card was ♣3 (3 damage) vs ♠4 shielded (4 HP): 3 < 4, shield absorbs without popping.

> **Example — Detonate:** You play ♣6 with Detonate targeting enemy ♥4 (4 HP, no shield). ♥4 takes 6 damage → destroyed. ♣6 is placed on your board (ATK 6, HP 6).

---

## 8. Summoning Sickness

When a card is played from hand to the board, it receives `playedThisTurn = true`.

- Cards with `playedThisTurn = true` **cannot attack** this turn
- **Exception:** Cards with **Haste** (from Berserk power or Diamond Elite abilities) CAN attack the turn they are played
- `playedThisTurn` resets to `false` at the start of the card owner's next turn

> **Example:** You play ♠6 with Bulwark. It's on the board but has summoning sickness — it cannot attack this turn. Next turn, it can attack normally. But if you played ♦6 with Berserk instead, it would have Haste and could attack immediately!

---

## 9. Elite Card Abilities

When you play an Elite card, you choose one of its **two abilities**. Elite abilities are more powerful than Normal card powers.

### 9.1 ♦ Diamond Elites

| Rank | ATK/HP | Ability 1 | Ability 2 |
|---|---|---|---|
| J | 12/12 | **Haste + Draw 1** — Can attack this turn AND draw 1 card | **Shield** — Gain a protective Shield bubble |
| Q | 13/13 | **Haste + Draw 2** — Can attack this turn AND draw 2 cards | **Shield** — Gain a protective Shield bubble |
| K | 14/14 | **Haste + Draw 3** — Can attack this turn AND draw 3 cards | **Shield** — Gain a protective Shield bubble |
| A | 0/0 | **Underlay** — Attach under a board Elite (see [Ace Underlay](#10-ace-underlay-system)) | **Symmetrical Draw** — BOTH players draw 4 cards |

> **Example:** You play ♦Q with Ability 1. The ♦Q (13/13) is placed on your board with Haste — it can attack this turn! You also draw 2 cards. Massive tempo swing!

> **Example:** You play ♦K with Ability 2. The ♦K (14/14) is placed on your board with a Shield. Enemy attacks must pop the shield before dealing HP damage.

### 9.2 ♥ Heart Elites

| Rank | ATK/HP | Ability 1 | Ability 2 |
|---|---|---|---|
| J | 12/12 | **Mind Control** — Steal an enemy card with ATK ≤ 12. Shield blocks but pops. Stolen card gets summoning sickness. | **Symmetrical Surge** — Heal ALL friendly board cards by 12 AND deal 12 direct damage to opponent |
| Q | 13/13 | **Mind Control** — Steal enemy card with ATK ≤ 13 | **Symmetrical Surge** — Heal all friendly by 13 AND deal 13 damage to opponent |
| K | 14/14 | **Mind Control** — Steal enemy card with ATK ≤ 14 | **Symmetrical Surge** — Heal all friendly by 14 AND deal 14 damage to opponent |
| A | 0/0 | **Underlay** — Attach under a board Elite | **Symmetrical Health Boost** — Both players: maxLP += 50, LP += 50 |

> **Example — Mind Control:** You play ♥Q (13/13) with Ability 1 targeting enemy ♦10 (ATK 10, no shield). Since 10 ≤ 13, the ♦10 is stolen and moved to YOUR board. It has summoning sickness (can't attack this turn). If the ♦10 had a Shield, the Mind Control still works but the shield pops off.

> **Example — Symmetrical Surge:** You play ♥K (14/14) with Ability 2. All your board cards heal 14 HP, and your opponent takes 14 direct LP damage. If your opponent has 12 LP — they're dead!

> **Example — Heart Ace Ability 2:** You play ♥A with its second ability. Both players' maxLP increases by 50 (150 → 200) and their current LP increases by 50. This extends the game and opens new strategic possibilities.

### 9.3 ♠ Spade Elites

| Rank | ATK/HP | Ability 1 | Ability 2 |
|---|---|---|---|
| J | 12/12 | **Tank + Stun All 1** — Become Tank AND stun ALL enemy board cards for 1 turn | **Search Elite** — Search deck or Defeated Pile for an Elite (rank A or J only) and draw it |
| Q | 13/13 | **Tank + Stun All 2** — Become Tank AND stun ALL enemy board cards for 2 turns | **Search Elite** — Search for Elite (rank A, J, or Q) |
| K | 14/14 | **Tank + Stun All 3** — Become Tank AND stun ALL enemy board cards for 3 turns | **Search Elite** — Search for Elite (rank A, J, Q, or K) |
| A | 0/0 | **Underlay** — Attach under a board Elite | **Global Stun** — Stun ENTIRE board (ALL cards, BOTH sides) for 4 turns |

> **Example — Tank + Stun:** You play ♠K (14/14) with Ability 1. The ♠K becomes a Tank and ALL enemy board cards are stunned for 3 turns. Your opponent's army is completely locked down while you swing freely!

> **Example — Search Elite:** You play ♠Q (13/13) with Ability 2. You search your deck and Defeated Pile for any Elite with rank A, J, or Q. You find ♦A in the Defeated Pile and draw it to your hand. Note: drawing from the Defeated Pile incurs fatigue damage.

> **Example — Global Stun (Ace):** You play ♠A with Ability 2. EVERY card on the entire board — yours AND your opponent's — is stunned for 4 turns. Nuclear option! The Ace is sent to the Defeated Pile.

### 9.4 ♣ Club Elites

| Rank | ATK/HP | Ability 1 | Ability 2 |
|---|---|---|---|
| J | 12/12 | **Mass Detonation** — Deal 12 damage to ALL enemy board cards (card stays on board, no self-destruct!) | **Summon** — Resurrect 2 defeated Normal Clubs cards (value < 12) from the Defeated Pile |
| Q | 13/13 | **Mass Detonation** — Deal 13 to all enemy board | **Summon** — Resurrect 3 defeated Normal Clubs (value < 13) |
| K | 14/14 | **Mass Detonation** — Deal 14 to all enemy board | **Summon** — Resurrect 4 defeated Normal Clubs (value < 14) |
| A | 0/0 | **Underlay** — Attach under a board Elite | **Board Wipe** — ALL cards on BOTH boards are sent to the Defeated Pile |

> **Example — Mass Detonation:** You play ♣K (14/14) with Ability 1. Every enemy board card takes 14 damage. Most Normal cards will be obliterated. AND the ♣K stays on your board as a 14/14 body — unlike Normal Kamikaze!

> **Example — Summon:** You play ♣Q (13/13) with Ability 2. You pull 3 defeated Normal Clubs cards (value < 13) from the Defeated Pile to your board. Instant army!

> **Example — Board Wipe (Ace):** You play ♣A with Ability 2. EVERY card on both boards is destroyed and sent to the Defeated Pile. Total annihilation. The ♣A itself goes to the Defeated Pile too.

---

## 10. Ace Underlay System

Aces are unique Elite cards that serve as **support units**. Instead of using their second (symmetrical) ability, they can be **attached under a friendly Elite on your board** to grant it additional powers.

### 10.1 How Underlaying Works

1. Play the Ace from your hand and choose **Ability 1 (Underlay)**
2. Select a **friendly Elite card** currently on your board as the target
3. The Ace is attached **under** the target Elite (visible as an underlay indicator)
4. The Ace's **suit power** activates on the target Elite

### 10.2 Underlay Rules

| Rule | Detail |
|---|---|
| Cannot underlay under a **stunned** Elite | The target Elite must not be stunned |
| Cannot underlay **same suit** | The Ace's suit must differ from the target Elite's suit |
| Counts as a **card play** | Uses one of your play limit slots |
| Ace goes to Defeated Pile | The Ace is NOT placed on the board — it goes to the Defeated Pile after use |

### 10.3 Underlay Powers by Suit

| Ace Suit | Power Granted to Target Elite |
|---|---|
| ♦ Diamond Ace | Target Elite gains Haste + Draw (based on target's rank: J=1, Q=2, K=3 cards) OR Shield |
| ♥ Heart Ace | Target Elite can use Mind Control (steal enemy card based on target's rank) OR Symmetrical Surge |
| ♠ Spade Ace | Target Elite becomes Tank + Stun All (based on target's rank) OR Search Elite |
| ♣ Club Ace | Target Elite deals mass damage to all enemies (based on target's rank) OR Summon Clubs |

> **Example:** You have ♠K (14/14) on your board. You play ♦A (Diamond Ace) as an underlay on ♠K. You choose Diamond's Power 1: ♠K gains Haste + Draw 3 cards. The ♠K can now attack this turn and you draw 3 cards! The ♦A goes to the Defeated Pile.

> **Example — Invalid Underlay:** You try to underlay ♠A under ♠K. BLOCKED — same suit! You cannot underlay a Spade Ace under a Spade Elite.

---

## 11. Combat

### 11.1 Initiating Combat

1. **Select an attacker** — click one of your board cards that can attack (not stunned, not summoning-sick unless Haste, has attacks remaining)
2. **Select a target** — click an enemy board card or the opponent's LP

### 11.2 Tank Forcing

If the opponent has any **non-stunned Tank cards** on their board, you **MUST** attack a Tank. You cannot target other cards or the player's LP until all Tanks are stunned or destroyed.

> **Example:** Enemy has Tank ♠9 and regular ♦5 on board. You MUST attack the ♠9. You cannot attack ♦5 or the opponent's LP.

### 11.3 Stunned Defenders

When you attack a **stunned** card:
- The stunned card deals **0 counter-damage** (it cannot fight back)
- Your attacker deals its full ATK as damage

> **Example:** Your ♦8 (ATK 8) attacks a stunned ♣6 (ATK 6, HP 6). The ♣6 takes 8 damage → destroyed. Your ♦8 takes 0 damage (stunned defender deals nothing).

### 11.4 Shield Logic

| Scenario | Result |
|---|---|
| Incoming damage ≥ defender's current HP | Shield **POPS** (is removed). ALL damage is absorbed. Defender keeps current HP. |
| Incoming damage < defender's HP | Shield **stays**. Damage is absorbed. |

> **Example:** Shielded ♦5 (HP 5, Shield ON). Your ♠7 attacks (ATK 7). Since 7 ≥ 5, the shield **pops** — all damage absorbed. ♦5 survives with 5 HP but no longer has a shield.

> **Example:** Shielded ♦8 (HP 8, Shield ON). Your ♣3 attacks (ATK 3). Since 3 < 8, the shield **stays** — absorbs the 3 damage. ♦8 still has 8 HP and still has its shield.

### 11.5 Excess Damage

This is a critical mechanic for dealing damage to the opponent's LP through combat!

**Rule:** Only the side with **higher or equal ATK** can deal excess damage.

| Scenario | Excess Damage |
|---|---|
| Attacker ATK ≥ Defender ATK | Excess = Damage dealt − Defender's previous HP → dealt to **opponent's LP** |
| Defender ATK > Attacker ATK | Excess = Defender's counter-damage − Attacker's previous HP → dealt to **attacker's player LP** |

> **Example — Attacker Excess:** Your ♣10 (ATK 10) attacks enemy ♦3 (ATK 3, HP 3). ♦3 takes 10 damage → destroyed. Excess = 10 - 3 = 7 damage dealt to opponent's LP! Meanwhile ♣10 takes 3 counter-damage (HP: 10 → 7).

> **Example — Defender Excess:** Your ♦4 (ATK 4) attacks enemy ♠9 (ATK 9, HP 9). ♦4 takes 9 counter-damage → destroyed. Excess = 9 - 4 = 5 damage dealt to YOUR LP! Meanwhile ♠9 takes 4 damage (HP: 9 → 5).

### 11.6 Direct Attack

You can attack the opponent's LP directly **ONLY** if they have **NO non-stunned Tanks** on their board.

- If enemy has no board cards → direct attack allowed
- If enemy has board cards but no Tanks → direct attack allowed
- If enemy has board cards with Tanks (and at least one is not stunned) → direct attack **NOT allowed**, must attack Tank

---

## 12. Special Mechanics

### 12.1 10-Card Hand Buff

A powerful bonus that activates when your hand reaches a critical mass.

**Activation:** When your hand reaches **exactly 10 cards**.

**Effects while active:**
| Effect | Description |
|---|---|
| Play limit override | You can play **3 cards** per turn (regardless of LP) |
| Dual activation | Normal cards activate **BOTH** their suit powers simultaneously |
| Draw freeze | Your draw phase is **SKIPPED** (you do not draw a card at the start of your turn) |

**Deactivation:** At the end of your turn, if your hand has **≤ 6 cards**, the buff deactivates.

> **Example — Dual Activation:** You have 10 cards in hand (buff active). You play ♦5. Both powers activate: Power 1 (Recruit — draw 1 card) AND Power 2 (Berserk — ♦5 has Haste). The ♦5 can attack immediately AND you drew a card!

> **Example — Hearts Dual:** You play ♥7 with the buff active. Both Feed (Heal 7 to a target) AND Sap (deal 7 damage to opponent) activate. You heal a friendly card by 7 AND deal 7 damage to the opponent!

### 12.2 Board Barrier Buff

A defensive bonus triggered by board presence.

| Condition | Effect |
|---|---|
| Board has **≥ 10 cards** | **Activates:** ALL friendly board cards gain Shield |
| Board drops to **≤ 6 cards** | **Deactivates:** No new shields granted (shields already on cards remain until popped) |
| Board has **7–9 cards** | **Hysteresis zone:** No change in state |

> **Example:** You have 9 cards on board (no buff). You summon a 10th card → Board Barrier activates! All 10 of your board cards gain Shield. Then 3 are destroyed (7 on board) — you're in the hysteresis zone, buff stays active but no new shields granted. If another is destroyed (6 on board), the buff deactivates — but shields already on cards remain.

### 12.3 Fatigue Draw (Empty Deck)

When your deck runs out of cards, you start drawing from an alternative source — with consequences.

**Fatigue Draw Rules:**
1. When your deck is **empty**, draw from the shared **Defeated Pile** (FIFO order — oldest defeated card first)
2. Each fatigue draw deals **escalating damage** to you:
   - 1st fatigue draw = 1 damage
   - 2nd fatigue draw = 2 damage
   - 3rd fatigue draw = 3 damage
   - ...and so on (tracked per player independently)
3. The drawn card is **fully reset**: ATK/HP/MaxHP return to base values, shield/tank/stun/underlays all cleared
4. If BOTH deck AND Defeated Pile are empty: you take fatigue damage but **no card is drawn**
5. **Fatigue damage can kill!**

> **Example:** Your deck is empty. It's your 3rd fatigue draw. You take 3 damage and draw the oldest card from the Defeated Pile (let's say a ♠7 that was stunned and at 2 HP when defeated). It enters your hand fully reset: ATK 7, HP 7, MaxHP 7, no stun, no shield, no tank.

> **Example — Fatal Fatigue:** You have 2 LP remaining and it's your 5th fatigue draw. You take 5 damage → LP drops to -3 → **YOU DIE!**

### 12.4 Overheal

When healing player LP beyond the maximum, the excess becomes a weapon!

- Healing is capped at **maxLP**
- The **excess** heal amount (amount that would go above maxLP) is dealt as **damage to the opponent**
- This **can kill** the opponent!

> **Example:** You have 148/150 LP. You play ♥9 with Feed targeting yourself. You heal 9. LP would be 157, but caps at 150 (only 2 healed). Excess = 9 - 2 = **7 damage** dealt to your opponent!

---

## 13. Forbidden Turn Restrictions

To prevent overpowered early plays, certain cards are restricted in the opening turns:

| Turn | Forbidden Cards |
|---|---|
| Turn 1 | Normal 10-value cards, Jack (J), Queen (Q), King (K) |
| Turn 2 | Jack (J), Queen (Q), King (K) |
| Turn 3 | Queen (Q), King (K) |
| Turn 4 | King (K) |
| Turn 5+ | **No restrictions** |

> **Important:** Aces (A) are **NEVER** restricted! You can play an Ace on Turn 1.

> **Example:** It's Turn 1. You have a ♦10, ♠J, and ♥3 in hand. You can only play the ♥3. The ♦10 and ♠J are forbidden this turn.

---

## 14. Victory Conditions

**Win the game by reducing your opponent's LP to 0 or below.**

This can happen through multiple methods:

| Method | Source |
|---|---|
| **Direct LP Attack** | Attacking the opponent's LP when they have no non-stunned Tanks |
| **Combat Excess Damage** | Excess damage from card combat spills to the opponent's LP |
| **Sap (♥ Power 2)** | Hearts Normal cards deal direct LP damage |
| **Fatigue Damage** | Drawing from empty deck + empty defeated pile |
| **Overheal Excess** | Healing beyond maxLP deals excess to opponent |
| **Symmetrical Surge** | Heart Elite's Ability 2 deals direct damage to opponent |
| **Kamikaze / Detonation** | Indirect via removing blockers, enabling direct attacks |

> **Note:** The game ends **immediately** when a player's LP reaches 0 or below, even if it happens during the opponent's turn (e.g., from defender excess damage or fatigue).

---

## 15. Defeated Pile

The Defeated Pile is a **shared, FIFO (First-In, First-Out) pile** where all destroyed and defeated cards accumulate.

### Key Properties

| Property | Detail |
|---|---|
| **Shared** | Both players' defeated cards go to the same pile |
| **FIFO Order** | Cards are drawn from the oldest entry first during fatigue draws |
| **Reset on Draw** | Cards drawn from the Defeated Pile are fully reset to base stats |

### Interactions with the Defeated Pile

| Mechanic | Interaction |
|---|---|
| **Fatigue Draw** | When deck is empty, draw from here (with fatigue damage) |
| **♣ Club Elite Summon** | Resurrect defeated Normal Clubs cards directly to board |
| **♠ Spade Elite Search** | Find Elites from deck OR Defeated Pile (incurs fatigue damage if from here) |
| **Kamikaze** | Clubs Normal Power 1 sends the card here without placing on board |
| **Board Wipe** | Club Ace Ability 2 sends all board cards here |
| **Aces (after use)** | Aces used for underlay or their second ability go here |

---

## 16. Quick Reference Tables

### Normal Card Powers Summary

| Suit | Power 1 | Power 2 |
|---|---|---|
| ♦ Diamonds | **Recruit** — Draw 1 card | **Berserk** — Haste (attack this turn) |
| ♥ Hearts | **Feed** — Heal target (overheal damages opponent) | **Sap** — Direct LP damage |
| ♠ Spades | **Bulwark** — Become Tank | **Knock Out** — Stun 1 enemy Normal for 1 turn |
| ♣ Clubs | **Kamikaze** — AOE damage, self-destruct | **Detonate** — Single-target damage, stays on board |

### Elite Card Quick Reference

| Suit | J (12/12) | Q (13/13) | K (14/14) | A (0/0) |
|---|---|---|---|---|
| ♦ | Haste+Draw 1 / Shield | Haste+Draw 2 / Shield | Haste+Draw 3 / Shield | Underlay / Both draw 4 |
| ♥ | MC ≤12 / Surge 12 | MC ≤13 / Surge 13 | MC ≤14 / Surge 14 | Underlay / +50 LP both |
| ♠ | Tank+Stun 1t / Search J,A | Tank+Stun 2t / Search J,Q,A | Tank+Stun 3t / Search J,Q,K,A | Underlay / Global Stun 4t |
| ♣ | AOE 12 / Summon 2 | AOE 13 / Summon 3 | AOE 14 / Summon 4 | Underlay / Board Wipe |

### Play Limits Summary

| LP Range | Cards per Turn |
|---|---|
| > 100 | 1 |
| 51–100 | 2 |
| ≤ 50 | 3 |
| 10-Card Buff | 3 |

### Turn Restrictions Summary

| Turn | Forbidden |
|---|---|
| 1 | 10-value normals, J, Q, K |
| 2 | J, Q, K |
| 3 | Q, K |
| 4 | K |
| 5+ | None |

---

> *"Master the draft, command the board, and crush your opponent. Welcome to Lit Elite."*

**— End of Rule Book —**
