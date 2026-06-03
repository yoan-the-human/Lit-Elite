import React, { useState } from 'react';
import Card from './Card';
import { SUIT_LABELS } from '../game/deckBuilder';

export default function EliteDraftPhase({ gameState, onDraftElite, onSelectFinalElites }) {
  const { draft, phase } = gameState;
  const { 
    availableElites, 
    currentDrafter, 
    currentEliteCategory, 
    draftedElitesA, 
    draftedElitesB,
    selectionTurn
  } = draft;

  const [selectedIds, setSelectedIds] = useState([]);

  const currentDrafterName = currentDrafter === 'A' ? 'Player A' : (gameState.mode === 'ai' ? 'Computer (AI)' : 'Player B');
  const selectionTurnName = selectionTurn === 'A' ? 'Player A' : (gameState.mode === 'ai' ? 'Computer (AI)' : 'Player B');

  // Handle final selection of 4 cards
  const handleToggleSelect = (cardId, rank, pool) => {
    if (selectedIds.includes(cardId)) {
      setSelectedIds(selectedIds.filter(id => id !== cardId));
    } else {
      // Find if we already selected this rank to prevent duplicates, or let them toggle freely
      // and validate at the end. Freely toggle with max 4 is cleaner.
      if (selectedIds.length < 4) {
        setSelectedIds([...selectedIds, cardId]);
      }
    }
  };

  const getRankCategoryLabel = (cat) => {
    switch(cat) {
      case 'K': return 'Kings (Value 13)';
      case 'Q': return 'Queens (Value 12)';
      case 'J': return 'Jacks (Value 11)';
      case 'A': return 'Aces (Value 14)';
      default: return '';
    }
  };

  // Draft category rules helper text
  const getCategoryRulesHelp = (cat) => {
    switch(cat) {
      case 'K':
      case 'J':
        return "Draft Order: Player A picks 1st -> Player B picks 2nd & 3rd -> Player A automatically receives the remaining card.";
      case 'Q':
      case 'A':
        return "Draft Order: Player B picks 1st -> Player A picks 2nd & 3rd -> Player B automatically receives the remaining card.";
      default: return "";
    }
  };

  // Validate selection for final 4 elites
  const validateFinalSelection = (pool) => {
    const chosen = pool.filter(c => selectedIds.includes(c.id));
    const ranks = chosen.map(c => c.rank);
    return chosen.length === 4 && 
           ranks.includes('J') && 
           ranks.includes('Q') && 
           ranks.includes('K') && 
           ranks.includes('A');
  };

  const handleConfirmSelection = () => {
    onSelectFinalElites(selectionTurn, selectedIds);
    setSelectedIds([]); // Reset for next player
  };

  // Render Elite list for sidebars
  const renderEliteDraftedList = (elites) => {
    if (elites.length === 0) return <div style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>No Elites drafted yet.</div>;
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
        {elites.map(card => {
          const label = SUIT_LABELS[card.suit];
          return (
            <div 
              key={card.id} 
              style={{ 
                padding: '8px', 
                borderRadius: '8px', 
                background: 'rgba(255,255,255,0.02)', 
                border: `1px solid rgba(255,255,255,0.06)`,
                textAlign: 'center'
              }}
            >
              <span style={{ color: label.color, fontWeight: '700', marginRight: '4px' }}>{label.symbol}</span>
              <span>{card.rank} ({card.atk}/{card.hp})</span>
            </div>
          );
        })}
      </div>
    );
  };

  if (phase === 'DRAFT_ELITE_SELECT') {
    // Selection phase (Select 4 out of 8)
    const pool = selectionTurn === 'A' ? draftedElitesA : draftedElitesB;
    const isSelectionValid = validateFinalSelection(pool);

    return (
      <div className="draft-screen">
        <div className="draft-header" style={{ justifyContent: 'center' }}>
          <h2 className="draft-title" style={{ textAlign: 'center' }}>
            Choose Your Deck Elites: <span style={{ color: 'var(--color-diamonds)' }}>{selectionTurnName}</span>
          </h2>
        </div>

        <div style={{ 
          textAlign: 'center', 
          fontSize: '1rem', 
          color: 'var(--text-bright)', 
          marginBottom: '20px',
          background: 'rgba(255,255,255,0.02)',
          padding: '16px',
          borderRadius: '8px',
          maxWidth: '800px',
          margin: '0 auto 20px auto'
        }}>
          You drafted 8 Elite cards. Select <strong style={{ color: 'var(--color-diamonds)' }}>exactly 4 cards</strong> (exactly one Jack, one Queen, one King, and one Ace) to form your deck!
        </div>

        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          gap: '30px',
          margin: '20px 0' 
        }}>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
            {pool.map((card) => {
              const isSelected = selectedIds.includes(card.id);
              const label = SUIT_LABELS[card.suit];
              return (
                <div 
                  key={card.id} 
                  style={{ position: 'relative', cursor: 'pointer' }}
                  onClick={() => {
                    // Block click for AI selection
                    if (gameState.mode === 'ai' && selectionTurn === 'B') return;
                    handleToggleSelect(card.id, card.rank, pool);
                  }}
                >
                  <Card card={card} />
                  {/* Select Checkbox overlay */}
                  <div style={{
                    position: 'absolute',
                    top: '-6px',
                    right: '-6px',
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: isSelected ? 'var(--color-clubs)' : 'rgba(0,0,0,0.7)',
                    border: '2px solid #fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.8rem',
                    fontWeight: '800',
                    color: '#fff',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.5)'
                  }}>
                    {isSelected ? '✓' : ''}
                  </div>
                </div>
              );
            })}
          </div>

          <div>
            <button 
              className="btn-premium btn-clubs"
              disabled={!isSelectionValid || (gameState.mode === 'ai' && selectionTurn === 'B')}
              onClick={handleConfirmSelection}
              style={{ fontSize: '1.1rem', padding: '12px 32px' }}
            >
              Confirm Selected Elites
            </button>
          </div>
        </div>
      </div>
    );
  }

  // standard draft phase (drafting 1 by 1)
  const currentCategoryElites = availableElites.filter(c => c.rank === currentEliteCategory);

  return (
    <div className="draft-screen">
      <div className="draft-header">
        <h2 className="draft-title">Phase II: Drafting Elite Cards</h2>
        <div className="draft-turn-indicator" style={{ border: `1px solid ${currentDrafter === 'A' ? 'var(--color-spades)' : 'var(--color-hearts)'}` }}>
          Drafter: <span style={{ color: currentDrafter === 'A' ? 'var(--color-spades)' : 'var(--color-hearts)', fontWeight: '700' }}>{currentDrafterName}</span>
        </div>
      </div>

      <div style={{ 
        textAlign: 'center', 
        fontSize: '0.9rem', 
        color: 'var(--text-dim)', 
        marginBottom: '20px',
        background: 'rgba(255,255,255,0.02)',
        padding: '10px',
        borderRadius: '8px'
      }}>
        <div style={{ fontWeight: '700', color: 'var(--text-bright)', marginBottom: '4px' }}>
          Current Drafting Category: {getRankCategoryLabel(currentEliteCategory)}
        </div>
        {getCategoryRulesHelp(currentEliteCategory)}
      </div>

      <div className="draft-container">
        {/* Left Sidebar: Player A */}
        <div className="glass-panel draft-sidebar">
          <h3 style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px' }}>Player A Elites</h3>
          <div style={{ marginTop: '12px' }}>
            {renderEliteDraftedList(draftedElitesA)}
          </div>
        </div>

        {/* Center: Pool */}
        <div className="glass-panel draft-pool">
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600' }}>Draft From Face-Up {currentEliteCategory}'s</h3>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '20px' }}>
            {currentCategoryElites.map((card) => (
              <Card 
                key={card.id} 
                card={card} 
                onClick={() => {
                  if (gameState.mode === 'ai' && currentDrafter === 'B') return;
                  onDraftElite(card.id);
                }} 
              />
            ))}
          </div>
        </div>

        {/* Right Sidebar: Player B */}
        <div className="glass-panel draft-sidebar">
          <h3 style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px' }}>
            {gameState.mode === 'ai' ? 'Computer Elites' : 'Player B Elites'}
          </h3>
          <div style={{ marginTop: '12px' }}>
            {renderEliteDraftedList(draftedElitesB)}
          </div>
        </div>
      </div>
    </div>
  );
}
