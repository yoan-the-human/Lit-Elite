import React from 'react';
import { SUIT_LABELS } from '../game/deckBuilder';

export default function Card({ card, onClick, isPlayable = false, isTargetable = false, showBack = false }) {
  if (showBack) {
    return (
      <div 
        className="card-element card-back" 
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #030712 100%)',
          borderColor: 'rgba(99, 102, 241, 0.4)',
          boxShadow: '0 4px 10px rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'default'
        }}
      >
        {/* Card back logo design */}
        <div style={{
          width: '70%',
          height: '70%',
          borderRadius: '6px',
          border: '1px solid rgba(99, 102, 241, 0.2)',
          background: 'rgba(255,255,255,0.02)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative'
        }}>
          <div style={{
            fontSize: '1.5rem',
            fontWeight: '800',
            color: '#6366f1',
            textShadow: '0 0 10px rgba(99, 102, 241, 0.8)',
            transform: 'rotate(-45deg)'
          }}>
            M
          </div>
          <div style={{
            position: 'absolute',
            width: '10px',
            height: '10px',
            border: '2px solid #ef4444',
            borderRadius: '50%',
            top: '8px',
            left: '8px'
          }} />
          <div style={{
            position: 'absolute',
            width: '10px',
            height: '10px',
            border: '2px solid #10b981',
            borderRadius: '50%',
            bottom: '8px',
            right: '8px'
          }} />
        </div>
      </div>
    );
  }

  const { suit, value, rank, isElite, atk, hp, maxHp, shield, stunnedTurns, underlays } = card;
  const labelInfo = SUIT_LABELS[suit];

  const classNames = [
    'card-element',
    suit,
    isPlayable ? 'playable' : '',
    isTargetable ? 'targetable' : '',
    stunnedTurns > 0 ? 'stunned' : '',
    shield ? 'has-shield' : ''
  ].filter(Boolean).join(' ');

  return (
    <div className={classNames} onClick={onClick}>
      {/* Top row: suit and elite indicator */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className={`card-suit-symbol ${suit}`}>{labelInfo.symbol}</span>
        {isElite && <span className="card-badge-elite">{rank}</span>}
      </div>

      {/* Center value */}
      <div className="card-center-rank" style={{ color: labelInfo.color }}>
        {rank || value}
      </div>

      {/* Underlay stack dots */}
      {underlays && underlays.length > 0 && (
        <div className="underlay-stack-indicator">
          {underlays.map((u, i) => (
            <div 
              key={i} 
              className={`underlay-dot ${u.suit}`} 
              title={`Underlaid Ace of ${u.suit}`}
            />
          ))}
        </div>
      )}

      {/* Bottom row stats */}
      <div className="card-stats-row">
        <span className="card-stat-atk" title="Attack Power">
          ⚔️{atk}
        </span>
        <span className="card-stat-hp" title="Health Points">
          ❤️{hp}/{maxHp}
        </span>
      </div>
    </div>
  );
}
