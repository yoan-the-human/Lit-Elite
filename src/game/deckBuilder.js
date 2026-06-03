export const SUITS = {
  DIAMONDS: 'diamonds',
  HEARTS: 'hearts',
  SPADES: 'spades',
  CLUBS: 'clubs'
};

export const SUIT_LABELS = {
  [SUITS.DIAMONDS]: { name: 'Diamonds', bulgarian: 'Каро', symbol: '♦', color: '#f59e0b', secondaryColor: '#fffbeb' },
  [SUITS.HEARTS]: { name: 'Hearts', bulgarian: 'Купа', symbol: '♥', color: '#ef4444', secondaryColor: '#fef2f2' },
  [SUITS.SPADES]: { name: 'Spades', bulgarian: 'Пика', symbol: '♠', color: '#6366f1', secondaryColor: '#e0e7ff' },
  [SUITS.CLUBS]: { name: 'Clubs', bulgarian: 'Спатия', symbol: '♣', color: '#10b981', secondaryColor: '#ecfdf5' }
};

// Generates the 8 normal card subsections
export const SUBSECTIONS = [
  { id: 'diamonds_odd', suit: SUITS.DIAMONDS, type: 'odd', cards: [3, 5, 7, 9] },
  { id: 'diamonds_even', suit: SUITS.DIAMONDS, type: 'even', cards: [2, 4, 6, 8, 10] },
  { id: 'hearts_odd', suit: SUITS.HEARTS, type: 'odd', cards: [3, 5, 7, 9] },
  { id: 'hearts_even', suit: SUITS.HEARTS, type: 'even', cards: [2, 4, 6, 8, 10] },
  { id: 'spades_odd', suit: SUITS.SPADES, type: 'odd', cards: [3, 5, 7, 9] },
  { id: 'spades_even', suit: SUITS.SPADES, type: 'even', cards: [2, 4, 6, 8, 10] },
  { id: 'clubs_odd', suit: SUITS.CLUBS, type: 'odd', cards: [3, 5, 7, 9] },
  { id: 'clubs_even', suit: SUITS.CLUBS, type: 'even', cards: [2, 4, 6, 8, 10] }
];

// Helper to check if two subsections are paired (belong to same suit)
export function getPairedSubsectionId(subId) {
  const [suit, type] = subId.split('_');
  const otherType = type === 'odd' ? 'even' : 'odd';
  return `${suit}_${otherType}`;
}

// Generate a card object
export function createCard(suit, value, isElite = false, rank = null) {
  return {
    id: `${suit}_${rank || value}`,
    suit,
    value,
    rank,
    isElite,
    baseAtk: value,
    baseHp: value,
    atk: value,
    hp: value,
    maxHp: value,
    shield: false,
    isTank: false,
    stunnedTurns: 0,
    underlays: [], // Attached Ace cards
    attackedThisTurn: 0, // Number of times attacked this turn
    hasHaste: false // Diamonds Strike ability
  };
}

// Generate the 16 Elite cards face-up
export function generateElites() {
  const ranks = [
    { rank: 'J', value: 11 },
    { rank: 'Q', value: 12 },
    { rank: 'K', value: 13 },
    { rank: 'A', value: 14 }
  ];
  const elites = [];
  for (const suit of Object.values(SUITS)) {
    for (const r of ranks) {
      elites.push(createCard(suit, r.value, true, r.rank));
    }
  }
  return elites;
}

// Helper to shuffle an array in place (Fisher-Yates)
export function shuffle(array) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// Build a deck according to the spacing constraint
export function buildDeck(normalCards, eliteCards) {
  const shuffledNormals = shuffle(normalCards);
  const shuffledElites = shuffle(eliteCards);

  const Nnorm = shuffledNormals.length;
  const Gbase = Math.floor(Nnorm / 4);
  const R = Nnorm % 4;

  // Determine group sizes for normal cards
  const groupSizes = [Gbase, Gbase, Gbase, Gbase];
  for (let i = 0; i < R; i++) {
    groupSizes[i] += 1;
  }

  // Populate the deck template:
  // [G1 Normals] -> [Elite 1] -> [G2 Normals] -> [Elite 2] -> [G3 Normals] -> [Elite 3] -> [G4 Normals] -> [Elite 4]
  const deck = [];
  let normalIdx = 0;
  let eliteIdx = 0;

  for (let i = 0; i < 4; i++) {
    const size = groupSizes[i];
    // Add normal cards
    for (let j = 0; j < size; j++) {
      if (normalIdx < shuffledNormals.length) {
        deck.push(shuffledNormals[normalIdx++]);
      }
    }
    // Add elite card
    if (eliteIdx < shuffledElites.length) {
      deck.push(shuffledElites[eliteIdx++]);
    }
  }

  return deck;
}
