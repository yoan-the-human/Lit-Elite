import React from 'react';
import { translateLog } from '../game/translations';

export default function GameLogs({ logs, language = 'en', isEmbedded = false }) {
  const reversedLogs = [...logs].reverse();

  return (
    <div className={isEmbedded ? "logs-embedded" : "sidebar-panel"}>
      <div className="log-feed-header">{language === 'bg' ? 'Дневник на битката' : 'Battle Feed Logs'}</div>
      <div className="log-feed-container">
        {reversedLogs.length === 0 ? (
          <div style={{ color: 'var(--text-dim)', fontStyle: 'italic' }}>
            {language === 'bg' ? 'Все още няма записани действия. Нека битката започне!' : 'No actions logged yet. Let the battle begin!'}
          </div>
        ) : (
          reversedLogs.map((log, index) => {
            // Apply different border colors depending on contents (e.g. damage, heal, draft)
            let borderColor = 'rgba(255,255,255,0.2)';
            if (log.includes('attacks') || log.includes('damage') || log.includes('detonates')) {
              borderColor = 'var(--color-hearts)'; // Red for damage
            } else if (log.includes('healed') || log.includes('resurrected') || log.includes('restore')) {
              borderColor = 'var(--color-clubs)'; // Green for heals
            } else if (log.includes('gains Strike') || log.includes('draws') || log.includes('gains Berserk')) {
              borderColor = 'var(--color-diamonds)'; // Gold/Orange for card draws and haste
            } else if (log.includes('Tank') || log.includes('stunned') || log.includes('stuns') || log.includes('Bulwark') || log.includes('Knock out')) {
              borderColor = 'var(--color-spades)'; // Indigo for defense/stuns
            }

            return (
              <div 
                key={index} 
                className="log-item"
                style={{ borderLeftColor: borderColor }}
              >
                {translateLog(log, language)}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
