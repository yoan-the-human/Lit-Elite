import React from 'react';
import { SUIT_LABELS } from '../game/deckBuilder';

export default function DraftPhase({ gameState, onSelectSubsection }) {
  const { draft } = gameState;
  const { availableSubsections, currentDrafter, step, playerANormals, playerBNormals } = draft;

  const currentDrafterName = currentDrafter === 'A' ? 'Player A' : (gameState.mode === 'ai' ? 'Computer (AI)' : 'Player B');

  // Helper to group cards by suit for sidebars
  const renderDraftedList = (normals) => {
    if (normals.length === 0) return <div style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>No cards drafted yet.</div>;

    // Group by suit
    const grouped = normals.reduce((acc, card) => {
      acc[card.suit] = acc[card.suit] || [];
      acc[card.suit].push(card.value);
      return acc;
    }, {});

    return Object.entries(grouped).map(([suit, values]) => {
      const label = SUIT_LABELS[suit];
      return (
        <div key={suit} className="drafted-list" style={{ marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600', color: label.color }}>
            <span>{label.symbol}</span>
            <span>{label.name} ({label.bulgarian})</span>
          </div>
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '4px' }}>
            {values.sort((a,b) => a-b).map((v, i) => (
              <span 
                key={i} 
                style={{ 
                  background: 'rgba(255,255,255,0.05)', 
                  border: '1px solid rgba(255,255,255,0.1)', 
                  borderRadius: '4px', 
                  padding: '2px 8px', 
                  fontSize: '0.8rem' 
                }}
              >
                {v}
              </span>
            ))}
          </div>
        </div>
      );
    });
  };

  return (
    <div className="draft-screen">
      <div className="draft-header">
        <h2 className="draft-title">Phase I: Drafting Normal Cards</h2>
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
        {step === 1 && "Step 1: Player A chooses 1 subsection. Player B receives the paired subsection of that suit automatically."}
        {step === 2 && "Step 2: Player B chooses 2 subsections. Player A receives the paired subsections automatically."}
        {step === 3 && "Step 3: Player A chooses 2 subsections. Player B receives the paired subsections automatically."}
        {step === 4 && "Step 4: Player B chooses remaining subsection. Player A receives the paired subsection automatically."}
      </div>

      <div className="draft-container">
        {/* Left Sidebar: Player A */}
        <div className="glass-panel draft-sidebar">
          <h3 style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px' }}>Player A Stash</h3>
          <div style={{ marginTop: '12px' }}>
            {renderDraftedList(playerANormals)}
          </div>
        </div>

        {/* Center: Pool */}
        <div className="glass-panel draft-pool">
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600' }}>Available Card Subsections</h3>
          {availableSubsections.length === 0 ? (
            <div style={{ color: 'var(--text-dim)' }}>All normal subsections drafted. Moving to Elite Cards!</div>
          ) : (
            <div className="subsection-grid">
              {availableSubsections.map((sub) => {
                const label = SUIT_LABELS[sub.suit];
                return (
                  <div 
                    key={sub.id} 
                    className={`sub-card ${sub.suit}`}
                    onClick={() => {
                      // Block selection if it's computer's turn in VS AI mode
                      if (gameState.mode === 'ai' && currentDrafter === 'B') return;
                      onSelectSubsection(sub.id);
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '1.2rem', fontWeight: '700', color: label.color }}>{label.symbol}</span>
                      <span style={{ textTransform: 'capitalize', fontSize: '0.8rem', opacity: 0.8 }}>{sub.type}</span>
                    </div>
                    <div style={{ fontSize: '1.1rem', fontWeight: '700', margin: '8px 0' }}>
                      {label.name} Sub-Deck
                    </div>
                    <div style={{ display: 'flex', gap: '4px', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                      Values: [{sub.cards.join(', ')}]
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Sidebar: Player B */}
        <div className="glass-panel draft-sidebar">
          <h3 style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px' }}>
            {gameState.mode === 'ai' ? 'Computer Stash' : 'Player B Stash'}
          </h3>
          <div style={{ marginTop: '12px' }}>
            {renderDraftedList(playerBNormals)}
          </div>
        </div>
      </div>
    </div>
  );
}
