import React, { useEffect, useRef } from 'react';

export default function GameLogs({ logs }) {
  const feedEndRef = useRef(null);

  useEffect(() => {
    // Scroll to bottom on every new log update
    if (feedEndRef.current) {
      feedEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  return (
    <div className="sidebar-panel">
      <div className="log-feed-header">Battle Feed Logs</div>
      <div className="log-feed-container">
        {logs.length === 0 ? (
          <div style={{ color: 'var(--text-dim)', fontStyle: 'italic' }}>
            No actions logged yet. Let the battle begin!
          </div>
        ) : (
          logs.map((log, index) => {
            // Apply different border colors depending on contents (e.g. damage, heal, draft)
            let borderColor = 'rgba(255,255,255,0.2)';
            if (log.includes('attacks') || log.includes('damage') || log.includes('detonates')) {
              borderColor = 'var(--color-hearts)'; // Red for damage
            } else if (log.includes('healed') || log.includes('resurrected') || log.includes('restore')) {
              borderColor = 'var(--color-clubs)'; // Green for heals
            } else if (log.includes('gains Strike') || log.includes('draws')) {
              borderColor = 'var(--color-diamonds)'; // Gold/Orange for card draws and haste
            } else if (log.includes('Tank') || log.includes('stunned') || log.includes('stuns')) {
              borderColor = 'var(--color-spades)'; // Indigo for defense/stuns
            }

            return (
              <div 
                key={index} 
                className="log-item"
                style={{ borderLeftColor: borderColor }}
              >
                {log}
              </div>
            );
          })
        )}
        <div ref={feedEndRef} />
      </div>
    </div>
  );
}
