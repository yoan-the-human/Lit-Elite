import React from 'react';
import { SUIT_LABELS } from '../game/deckBuilder';

export default function DraftPhase({ gameState, onSelectSubsection, language = 'en' }) {
  const { draft } = gameState;
  const { availableSubsections, currentDrafter, step, playerANormals, playerBNormals } = draft;

  const currentDrafterName = currentDrafter === 'A' 
    ? (language === 'bg' ? 'Играч А' : 'Player A') 
    : (gameState.mode === 'ai' ? (language === 'bg' ? 'Компютър (AI)' : 'Computer (AI)') : (language === 'bg' ? 'Играч Б' : 'Player B'));

  // Helper to group cards by suit for sidebars
  const renderDraftedList = (normals) => {
    if (normals.length === 0) return <div style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>{language === 'bg' ? 'Все още няма избрани карти.' : 'No cards drafted yet.'}</div>;

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
            <span>{language === 'bg' ? label.bulgarian : label.name}</span>
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
        <h2 className="draft-title">{language === 'bg' ? 'Фаза I: Избиране на Нормални Карти' : 'Phase I: Drafting Normal Cards'}</h2>
        <div className="draft-turn-indicator" style={{ border: `1px solid ${currentDrafter === 'A' ? 'var(--color-spades)' : 'var(--color-hearts)'}` }}>
          {language === 'bg' ? 'Избиращ:' : 'Drafter:'} <span style={{ color: currentDrafter === 'A' ? 'var(--color-spades)' : 'var(--color-hearts)', fontWeight: '700' }}>{currentDrafterName}</span>
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
        {step === 1 && (language === 'bg' ? 'Стъпка 1: Играч А избира 1 четно тесте (съдържащо 10-ката). Играч Б получава съответното нечетно тесте автоматично.' : 'Step 1: Player A chooses 1 Even subdeck (with the 10). Player B receives the paired Odd subdeck automatically.')}
        {step === 2 && (language === 'bg' ? 'Стъпка 2: Играч Б избира 2 четни тестета. Играч А получава съответните нечетни тестета автоматично.' : 'Step 2: Player B chooses 2 Even subdecks. Player A receives the paired Odd subdecks automatically.')}
      </div>

      <div className="draft-container">
        {/* Left Sidebar: Player A */}
        <div className="glass-panel draft-sidebar">
          <h3 style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px' }}>{language === 'bg' ? 'Играч А - Сбор' : 'Player A Stash'}</h3>
          <div style={{ marginTop: '12px' }}>
            {renderDraftedList(playerANormals)}
          </div>
        </div>

        {/* Center: Pool */}
        <div className="glass-panel draft-pool">
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600' }}>{language === 'bg' ? 'Налични подсекции карти (Само Четни)' : 'Available Card Subsections (Even Only)'}</h3>
          {availableSubsections.filter(s => s.type === 'even').length === 0 ? (
            <div style={{ color: 'var(--text-dim)' }}>{language === 'bg' ? 'Всички нормални подсекции са избрани. Преминаване към Елитни карти!' : 'All normal subsections drafted. Moving to Elite Cards!'}</div>
          ) : (
            <div className="subsection-grid">
              {availableSubsections.filter(s => s.type === 'even').map((sub) => {
                const label = SUIT_LABELS[sub.suit];
                return (
                  <div 
                    key={sub.id} 
                    className={`sub-card ${sub.suit}`}
                    onClick={() => {
                      // Block selection if it's computer's turn in VS AI mode
                      if (gameState.mode === 'ai' && currentDrafter === 'B') return;
                      // Block selection if online mode and not my turn
                      if (gameState.mode === 'online' && gameState.onlineRole !== currentDrafter) return;
                      onSelectSubsection(sub.id);
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '1.2rem', fontWeight: '700', color: label.color }}>{label.symbol}</span>
                      <span style={{ textTransform: 'capitalize', fontSize: '0.8rem', opacity: 0.8 }}>{language === 'bg' ? (sub.type === 'even' ? 'четни' : 'нечетни') : sub.type}</span>
                    </div>
                    <div style={{ fontSize: '1.1rem', fontWeight: '700', margin: '8px 0' }}>
                      {language === 'bg' ? `${label.bulgarian} Четно тесте` : `${label.name} Even Subdeck`}
                    </div>
                    <div style={{ display: 'flex', gap: '4px', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                      {language === 'bg' ? 'Стойности:' : 'Values:'} [{sub.cards.join(', ')}]
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
            {gameState.mode === 'ai' ? (language === 'bg' ? 'Компютър - Сбор' : 'Computer Stash') : (language === 'bg' ? 'Играч Б - Сбор' : 'Player B Stash')}
          </h3>
          <div style={{ marginTop: '12px' }}>
            {renderDraftedList(playerBNormals)}
          </div>
        </div>
      </div>
    </div>
  );
}
