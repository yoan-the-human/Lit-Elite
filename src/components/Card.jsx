import React from 'react';
import { SUIT_LABELS } from '../game/deckBuilder';

export default function Card({ card, onClick, isPlayable = false, isTargetable = false, isAttackReady = false, showBack = false, language = 'en' }) {
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

  const { suit, value, rank, isElite, atk, hp, maxHp, shield, stunnedTurns, underlays, isTank } = card;
  const labelInfo = SUIT_LABELS[suit];

  const classNames = [
    'card-element',
    suit,
    isPlayable ? 'playable' : '',
    isTargetable ? 'targetable' : '',
    isAttackReady ? 'attack-ready' : '',
    stunnedTurns > 0 ? 'stunned' : '',
    shield ? 'has-shield' : ''
  ].filter(Boolean).join(' ');

  return (
    <div className={classNames} onClick={onClick}>
      {/* Top row: suit and attack stat */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className={`card-suit-symbol ${suit}`}>{labelInfo.symbol}</span>
        {rank !== 'A' && (
          <span className="card-stat-atk" title="Attack Power" style={{ fontSize: '0.85rem', fontWeight: '800' }}>
            ⚔️{atk}
          </span>
        )}
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

      {/* Attack Ready Indicator */}
      {isAttackReady && (
        <div style={{
          position: 'absolute',
          top: '6px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(34,197,94,0.95)',
          border: '1px solid #fff',
          borderRadius: '4px',
          color: '#fff',
          fontSize: '0.55rem',
          fontWeight: '800',
          padding: '1px 4px',
          whiteSpace: 'nowrap',
          boxShadow: '0 0 6px rgba(34, 197, 94, 0.6)',
          zIndex: 5
        }}>
          {language === 'bg' ? '⚔️ ГОТОВ' : '⚔️ READY'}
        </div>
      )}

      {/* Tank Indicator */}
      {isTank && (
        <div style={{
          position: 'absolute',
          top: '32px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(0,0,0,0.85)',
          border: '1px solid #f59e0b',
          borderRadius: '4px',
          color: '#f59e0b',
          fontSize: '0.55rem',
          fontWeight: '800',
          padding: '1px 4px',
          whiteSpace: 'nowrap',
          boxShadow: '0 0 6px rgba(245, 158, 11, 0.4)',
          zIndex: 5
        }}>
          {language === 'bg' ? '🛡️ ТАНК' : '🛡️ TANK'}
        </div>
      )}

      {/* Stun Indicator */}
      {stunnedTurns > 0 && (
        <div style={{
          position: 'absolute',
          bottom: rank === 'A' ? '12px' : '32px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(239, 68, 68, 0.95)',
          border: '1px solid #fff',
          borderRadius: '4px',
          color: '#fff',
          fontSize: '0.55rem',
          fontWeight: '800',
          padding: '1px 4px',
          whiteSpace: 'nowrap',
          boxShadow: '0 0 6px rgba(239, 68, 68, 0.6)',
          zIndex: 5
        }}>
          {language === 'bg' ? `⚡ СТЪН: ${stunnedTurns}` : `⚡ STUN: ${stunnedTurns}`}
        </div>
      )}

      {/* Bottom row stats */}
      {rank !== 'A' && (
        <div className="card-stats-row" style={{ justifyContent: 'center' }}>
          <span className="card-stat-hp" title="Health Points">
            ❤️{hp}/{maxHp}
          </span>
        </div>
      )}
    </div>
  );
}
